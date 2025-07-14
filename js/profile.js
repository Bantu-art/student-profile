// Zone01 Kisumu Profile Page Logic
class ProfileManager {
  constructor() {
    this.apiUrl = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';
    this.token = localStorage.getItem('jwt_token');
    this.profileData = null;
    this.init();
  }

  init() {
    // Check authentication first
    if (!this.requireAuth()) {
      return;
    }

    this.setupEventListeners();
    this.loadProfileData();
  }

  requireAuth() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      window.location.href = 'login.html';
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp <= now) {
        localStorage.removeItem('jwt_token');
        window.location.href = 'login.html';
        return false;
      }
      return true;
    } catch (error) {
      localStorage.removeItem('jwt_token');
      window.location.href = 'login.html';
      return false;
    }
  }

  setupEventListeners() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    localStorage.removeItem('login_time');
    window.location.href = '../index.html';
  }

  async loadProfileData() {
    try {
      console.log('Loading profile data...');
      this.profileData = await this.getProfileData();
      console.log('Profile data loaded:', this.profileData);
      this.displayProfileData();
      this.generateCharts();
    } catch (error) {
      console.error('Failed to load profile data:', error);
      this.showError(error.message);
    }
  }

  async makeRequest(query, variables = {}) {
    if (!this.token) {
      throw new Error('No authentication token available');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          query: query,
          variables: variables
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(result.errors.map(e => e.message).join(', '));
      }

      return result.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  getUserIdFromToken() {
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      return payload.sub || payload['https://hasura.io/jwt/claims']['x-hasura-user-id'];
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  }

  async getUserInfo(userId) {
    const query = `
      query GetUser($userId: Int!) {
        user(where: {id: {_eq: $userId}}) {
          id
          login
          email
          firstName
          lastName
          createdAt
          totalUp
          totalDown
        }
      }
    `;

    const data = await this.makeRequest(query, { userId: parseInt(userId) });
    return data.user[0] || null;
  }

  async getUserTransactions(userId, limit = 100) {
    const query = `
      query GetTransactions($userId: Int!, $limit: Int!) {
        transaction(
          where: {userId: {_eq: $userId}},
          limit: $limit,
          order_by: {createdAt: desc}
        ) {
          id
          type
          amount
          createdAt
          path
          object {
            name
            type
          }
        }
      }
    `;

    const data = await this.makeRequest(query, { userId: parseInt(userId), limit });
    return data.transaction || [];
  }

  async getUserProgress(userId, limit = 50) {
    const query = `
      query GetProgress($userId: Int!, $limit: Int!) {
        progress(
          where: {userId: {_eq: $userId}},
          limit: $limit,
          order_by: {createdAt: desc}
        ) {
          id
          grade
          createdAt
          path
          object {
            name
            type
          }
        }
      }
    `;

    const data = await this.makeRequest(query, { userId: parseInt(userId), limit });
    return data.progress || [];
  }

  async getProfileData() {
    const userId = this.getUserIdFromToken();
    if (!userId) {
      throw new Error('Unable to extract user ID from token');
    }

    console.log('Fetching data for user ID:', userId);

    try {
      // Fetch all data in parallel
      const [userInfo, transactions, progress] = await Promise.all([
        this.getUserInfo(userId),
        this.getUserTransactions(userId),
        this.getUserProgress(userId)
      ]);

      console.log('Raw data fetched:', { userInfo, transactions, progress });

      // Process the data
      const profileData = this.processProfileData({
        user: userInfo,
        transactions: transactions,
        progress: progress
      });

      return profileData;

    } catch (error) {
      console.error('Error fetching profile data:', error);
      throw error;
    }
  }

  processProfileData(rawData) {
    const { user, transactions, progress } = rawData;

    // Process XP transactions
    const xpTransactions = transactions.filter(t => t.type === 'xp');
    const totalXP = xpTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Use actual totalUp and totalDown from user object (not transaction counts)
    const totalUp = user?.totalUp || 0;
    const totalDown = user?.totalDown || 0;

    // Process projects (from progress data)
    const projects = progress.filter(p => p.object && p.object.type === 'project');

    // Extract skills from paths
    const skillPaths = progress.map(p => p.path).filter(Boolean);
    const skills = this.extractSkillsFromPaths(skillPaths);

    return {
      user: {
        id: user?.id,
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User',
        username: user?.login || 'unknown',
        email: user?.email || '',
        joinDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        initials: this.getInitials(user?.firstName, user?.lastName)
      },
      stats: {
        totalXP: totalXP,
        totalProjects: projects.length,
        totalUp: totalUp,
        totalDown: totalDown,
        auditRatio: totalDown > 0 ? totalUp / totalDown : (totalUp > 0 ? 1 : 0)
      },
      skills: skills
    };
  }

  extractSkillsFromPaths(paths) {
    const skillMap = {};

    paths.forEach(path => {
      const parts = path.split('/');
      if (parts.length >= 3) {
        const skill = parts[2]; // e.g., 'piscine-go', 'module'
        if (!skillMap[skill]) {
          skillMap[skill] = { name: skill, count: 0 };
        }
        skillMap[skill].count++;
      }
    });

    return Object.values(skillMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 skills
  }

  getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
  }

  displayProfileData() {
    if (!this.profileData) return;

    const { user, stats, skills } = this.profileData;

    // Update user information
    this.updateElement('user-name', user.name);
    this.updateElement('user-email', user.email);
    this.updateElement('user-login', `@${user.username}`);
    this.updateElement('user-initials', user.initials);

    // Update XP information
    this.updateElement('total-xp', `${stats.totalXP.toLocaleString()} XP`);
    const level = this.calculateLevel(stats.totalXP);
    this.updateElement('xp-level', `Level ${level}`);

    // Update audit information
    this.updateElement('audit-ratio', stats.auditRatio.toFixed(2));
    this.updateElement('audit-up', `${stats.totalUp || 0} ↑`);
    this.updateElement('audit-down', `${stats.totalDown || 0} ↓`);

    // Update skills
    this.updateSkillsDisplay(skills);
  }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    calculateAuditRatio(stats) {
        // Audit ratio = XP received / XP given through audits
        // For now, we'll use a simplified calculation based on up/down votes
        const totalVotes = (stats.upVotes || 0) + (stats.downVotes || 0);
        if (totalVotes === 0) return 0;

        // Simple ratio: up votes / total votes
        // In a real implementation, this would be based on actual XP transactions
        return (stats.upVotes || 0) / totalVotes;
    }

    updateAuditPerformance(auditRatio) {
        const performanceFill = document.getElementById('performanceFill');
        const performanceLabel = document.getElementById('performanceLabel');

        if (performanceFill && performanceLabel) {
            // Convert ratio to percentage for display
            const percentage = auditRatio * 100;
            performanceFill.style.width = `${percentage}%`;

            // Set performance label based on ratio
            let label = '';
            if (auditRatio >= 0.8) {
                label = 'Excellent';
                performanceFill.style.background = '#22c55e';
            } else if (auditRatio >= 0.6) {
                label = 'Good';
                performanceFill.style.background = 'linear-gradient(90deg, #f59e0b 0%, #22c55e 100%)';
            } else if (auditRatio >= 0.4) {
                label = 'Average';
                performanceFill.style.background = '#f59e0b';
            } else if (auditRatio > 0) {
                label = 'Needs Improvement';
                performanceFill.style.background = 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)';
            } else {
                label = 'No Data';
                performanceFill.style.background = '#6b7280';
            }

            performanceLabel.textContent = label;
        }
    }

  updateSkillsDisplay(skills) {
    const skillsContainer = document.getElementById('skills-container');
    if (!skillsContainer) return;

    if (!skills || skills.length === 0) {
      skillsContainer.innerHTML = '<p>No skills data available</p>';
      return;
    }

    // Clear existing skills
    skillsContainer.innerHTML = '';

    // Add skills as tags
    skills.forEach(skill => {
      const skillTag = document.createElement('span');
      skillTag.className = 'skill-tag';
      skillTag.textContent = skill.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      skillsContainer.appendChild(skillTag);
    });
  }

    getSkillLevel(count) {
        if (count >= 20) return 'Expert';
        if (count >= 10) return 'Advanced';
        if (count >= 5) return 'Intermediate';
        if (count >= 2) return 'Beginner';
        return 'Learning';
    }

  generateCharts() {
    this.generateXPChart();
    this.generateGradeChart();
  }

  generateXPChart() {
    const container = document.getElementById('xp-chart');
    if (!container || !this.profileData) return;

    // Clear previous chart
    container.innerHTML = '';

    // Sample XP data - in real implementation, this would come from transactions
    const xpData = [
      { date: '2024-01', xp: 1000 },
      { date: '2024-02', xp: 2500 },
      { date: '2024-03', xp: 4200 },
      { date: '2024-04', xp: 6800 },
      { date: '2024-05', xp: 9500 },
      { date: '2024-06', xp: this.profileData.stats.totalXP }
    ];

    this.createLineChart(container, xpData, 'date', 'xp', 'XP Progress');
  }

  generateGradeChart() {
    const container = document.getElementById('grade-chart');
    if (!container || !this.profileData) return;

    // Clear previous chart
    container.innerHTML = '';

    // Sample grade distribution data
    const gradeData = [
      { grade: 'A (90-100%)', count: 3 },
      { grade: 'B (80-89%)', count: 5 },
      { grade: 'C (70-79%)', count: 2 },
      { grade: 'D (60-69%)', count: 1 },
      { grade: 'F (<60%)', count: 0 }
    ];

    this.createBarChart(container, gradeData, 'grade', 'count', 'Grade Distribution');
  }

  createLineChart(container, data, xKey, yKey, title) {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scalePoint()
      .domain(data.map(d => d[xKey]))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[yKey])])
      .range([height, 0]);

    // Line generator
    const line = d3.line()
      .x(d => xScale(d[xKey]))
      .y(d => yScale(d[yKey]))
      .curve(d3.curveMonotoneX);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', '#cbd5e1');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', '#cbd5e1');

    // Add line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d[xKey]))
      .attr('cy', d => yScale(d[yKey]))
      .attr('r', 4)
      .attr('fill', '#3b82f6');
  }

  createBarChart(container, data, xKey, yKey, title) {
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d[xKey]))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d[yKey])])
      .range([height, 0]);

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', '#cbd5e1')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', '#cbd5e1');

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d[xKey]))
      .attr('width', xScale.bandwidth())
      .attr('y', d => yScale(d[yKey]))
      .attr('height', d => height - yScale(d[yKey]))
      .attr('fill', '#06b6d4');
  }

    async generateXPProgressChart() {
        const chartContainer = document.getElementById('progressChart');
        if (!chartContainer) return;

        try {
            // Get XP transaction data
            const userId = this.api.getUserIdFromToken();
            const transactions = await this.api.getUserTransactions(userId, 100);
            const xpData = transactions.filter(t => t.type === 'xp');

            if (xpData.length === 0) {
                chartContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6b7280;">
                        <p>📊 No XP data available yet</p>
                        <p style="font-size: 14px;">Complete projects to see your XP progression</p>
                    </div>
                `;
                return;
            }

            // Process XP data for cumulative chart
            let cumulativeXP = 0;
            const xpProgression = xpData
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                .map(transaction => {
                    cumulativeXP += transaction.amount;
                    return {
                        date: new Date(transaction.createdAt),
                        xp: transaction.amount,
                        total: cumulativeXP,
                        project: transaction.object?.name || 'Unknown Project'
                    };
                });

            // Create enhanced SVG chart
            const svg = this.createEnhancedSVGChart(400, 250, 'XP Progression Over Time');
            this.drawXPProgressChart(svg, xpProgression, 400, 250);

            chartContainer.innerHTML = '';
            chartContainer.appendChild(svg);

        } catch (error) {
            console.error('Error generating XP chart:', error);
            chartContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <p>⚠️ Error loading XP data</p>
                    <p style="font-size: 14px;">${error.message}</p>
                </div>
            `;
        }
    }

    async generateAuditActivityChart() {
        const chartContainer = document.getElementById('gradeChart');
        if (!chartContainer) return;

        try {
            // Get audit transaction data
            const userId = this.api.getUserIdFromToken();
            const transactions = await this.api.getUserTransactions(userId, 100);
            const auditData = transactions.filter(t => ['up', 'down'].includes(t.type));

            if (auditData.length === 0) {
                chartContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #6b7280;">
                        <p>👥 No audit data available</p>
                        <p style="font-size: 14px;">Participate in peer reviews to see your audit activity</p>
                    </div>
                `;
                return;
            }

            // Process audit activity data
            const auditStats = this.processAuditStats(auditData);

            // Create enhanced SVG chart
            const svg = this.createEnhancedSVGChart(400, 250, 'Audit Activity Distribution');
            this.drawAuditActivityChart(svg, auditStats, 400, 250);

            chartContainer.innerHTML = '';
            chartContainer.appendChild(svg);

        } catch (error) {
            console.error('Error generating audit chart:', error);
            chartContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <p>⚠️ Error loading audit data</p>
                    <p style="font-size: 14px;">${error.message}</p>
                </div>
            `;
        }
    }

    createEnhancedSVGChart(width, height, title) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.background = 'white';
        svg.style.borderRadius = '6px';
        svg.style.border = '1px solid #e5e7eb';

        // Add title
        if (title) {
            const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            titleText.setAttribute('x', width / 2);
            titleText.setAttribute('y', 20);
            titleText.setAttribute('text-anchor', 'middle');
            titleText.setAttribute('fill', '#374151');
            titleText.setAttribute('font-size', '14');
            titleText.setAttribute('font-weight', '600');
            titleText.textContent = title;
            svg.appendChild(titleText);
        }

        return svg;
    }

    processAuditStats(auditData) {
        const stats = {
            upVotes: 0,
            downVotes: 0,
            totalVotes: 0
        };

        const auditDetails = [];

        auditData.forEach(audit => {
            const detail = {
                type: audit.type,
                amount: audit.amount,
                date: new Date(audit.createdAt),
                path: audit.path
            };

            if (audit.type === 'up') {
                stats.upVotes++;
            } else if (audit.type === 'down') {
                stats.downVotes++;
            }
            stats.totalVotes++;

            auditDetails.push(detail);
        });

        // Calculate ratio and performance metrics
        stats.ratio = stats.totalVotes > 0 ? stats.upVotes / stats.totalVotes : 0;
        stats.performance = this.getAuditPerformanceLevel(stats.ratio);

        return { stats, details: auditDetails };
    }

    getAuditPerformanceLevel(ratio) {
        if (ratio >= 0.8) return 'Excellent';
        if (ratio >= 0.6) return 'Good';
        if (ratio >= 0.4) return 'Average';
        if (ratio > 0) return 'Needs Improvement';
        return 'No Data';
    }

    drawXPProgressChart(svg, xpData, width, height) {
        const margin = { top: 40, right: 30, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        if (xpData.length === 0) return;

        // Create scales
        const maxXP = Math.max(...xpData.map(d => d.total));
        const minDate = xpData[0].date;
        const maxDate = xpData[xpData.length - 1].date;
        const timeRange = maxDate - minDate;

        // Draw grid lines
        this.drawGrid(svg, margin, chartWidth, chartHeight, maxXP);

        // Draw XP progression line
        const pathData = xpData.map((d, i) => {
            const x = margin.left + (i / (xpData.length - 1)) * chartWidth;
            const y = margin.top + chartHeight - (d.total / maxXP) * chartHeight;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        // Add gradient definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'xpGradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#667eea');
        stop1.setAttribute('stop-opacity', '0.8');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#667eea');
        stop2.setAttribute('stop-opacity', '0.1');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);

        // Draw area under the line
        const areaPath = pathData + ` L ${margin.left + chartWidth} ${margin.top + chartHeight} L ${margin.left} ${margin.top + chartHeight} Z`;
        const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        area.setAttribute('d', areaPath);
        area.setAttribute('fill', 'url(#xpGradient)');
        svg.appendChild(area);

        // Draw the line
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#667eea');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);

        // Draw data points with tooltips
        xpData.forEach((d, i) => {
            const x = margin.left + (i / (xpData.length - 1)) * chartWidth;
            const y = margin.top + chartHeight - (d.total / maxXP) * chartHeight;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '5');
            circle.setAttribute('fill', '#667eea');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            circle.style.cursor = 'pointer';

            // Add hover effect
            circle.addEventListener('mouseenter', () => {
                circle.setAttribute('r', '7');
                this.showTooltip(svg, x, y, `${d.project}: +${d.xp} XP\nTotal: ${d.total.toLocaleString()} XP\n${d.date.toLocaleDateString()}`);
            });

            circle.addEventListener('mouseleave', () => {
                circle.setAttribute('r', '5');
                this.hideTooltip(svg);
            });

            svg.appendChild(circle);
        });

        // Add axes labels
        this.addAxisLabels(svg, width, height, 'Time', 'Total XP');

        // Add current XP value
        const currentXP = xpData[xpData.length - 1].total;
        const currentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        currentText.setAttribute('x', width - 10);
        currentText.setAttribute('y', 35);
        currentText.setAttribute('text-anchor', 'end');
        currentText.setAttribute('fill', '#667eea');
        currentText.setAttribute('font-size', '16');
        currentText.setAttribute('font-weight', '700');
        currentText.textContent = `${currentXP.toLocaleString()} XP`;
        svg.appendChild(currentText);
    }

    drawAuditActivityChart(svg, auditStats, width, height) {
        const margin = { top: 40, right: 30, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const { stats } = auditStats;
        const categories = [
            { label: 'Up Votes', count: stats.upVotes, color: '#22c55e' },
            { label: 'Down Votes', count: stats.downVotes, color: '#ef4444' }
        ];

        const maxCount = Math.max(...categories.map(c => c.count));
        if (maxCount === 0) {
            const noDataText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            noDataText.setAttribute('x', width / 2);
            noDataText.setAttribute('y', height / 2);
            noDataText.setAttribute('text-anchor', 'middle');
            noDataText.setAttribute('fill', '#6b7280');
            noDataText.textContent = 'No audit data available';
            svg.appendChild(noDataText);
            return;
        }

        const barWidth = chartWidth / categories.length * 0.6;
        const barSpacing = chartWidth / categories.length * 0.4;

        // Draw bars
        categories.forEach((category, i) => {
            const x = margin.left + (i * (barWidth + barSpacing)) + barSpacing / 2;
            const barHeight = (category.count / maxCount) * chartHeight;
            const y = margin.top + chartHeight - barHeight;

            // Draw bar
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', category.color);
            rect.setAttribute('rx', '6');
            rect.style.cursor = 'pointer';

            // Add hover effect
            rect.addEventListener('mouseenter', () => {
                rect.setAttribute('opacity', '0.8');
                this.showTooltip(svg, x + barWidth/2, y, `${category.label}: ${category.count} votes`);
            });

            rect.addEventListener('mouseleave', () => {
                rect.setAttribute('opacity', '1');
                this.hideTooltip(svg);
            });

            svg.appendChild(rect);

            // Add count label on top of bar
            if (category.count > 0) {
                const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                countText.setAttribute('x', x + barWidth / 2);
                countText.setAttribute('y', y - 5);
                countText.setAttribute('text-anchor', 'middle');
                countText.setAttribute('fill', '#374151');
                countText.setAttribute('font-size', '16');
                countText.setAttribute('font-weight', '700');
                countText.textContent = category.count;
                svg.appendChild(countText);
            }

            // Add category label
            const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            labelText.setAttribute('x', x + barWidth / 2);
            labelText.setAttribute('y', margin.top + chartHeight + 25);
            labelText.setAttribute('text-anchor', 'middle');
            labelText.setAttribute('fill', '#6b7280');
            labelText.setAttribute('font-size', '14');
            labelText.setAttribute('font-weight', '600');
            labelText.textContent = category.label;
            svg.appendChild(labelText);
        });

        // Add audit ratio summary
        const ratio = (stats.ratio * 100).toFixed(1);

        const summaryText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        summaryText.setAttribute('x', width - 10);
        summaryText.setAttribute('y', 35);
        summaryText.setAttribute('text-anchor', 'end');
        summaryText.setAttribute('fill', stats.ratio >= 0.6 ? '#22c55e' : '#f59e0b');
        summaryText.setAttribute('font-size', '16');
        summaryText.setAttribute('font-weight', '700');
        summaryText.textContent = `${ratio}% Positive Rate`;
        svg.appendChild(summaryText);
    }

    drawGrid(svg, margin, chartWidth, chartHeight, maxValue) {
        const gridLines = 5;

        // Horizontal grid lines
        for (let i = 0; i <= gridLines; i++) {
            const y = margin.top + (i / gridLines) * chartHeight;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', margin.left);
            line.setAttribute('y1', y);
            line.setAttribute('x2', margin.left + chartWidth);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#f3f4f6');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);

            // Add value labels
            const value = maxValue * (1 - i / gridLines);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', margin.left - 10);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', '#9ca3af');
            text.setAttribute('font-size', '10');
            text.textContent = Math.round(value).toLocaleString();
            svg.appendChild(text);
        }
    }

    addAxisLabels(svg, width, height, xLabel, yLabel) {
        // X-axis label
        const xLabelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabelText.setAttribute('x', width / 2);
        xLabelText.setAttribute('y', height - 10);
        xLabelText.setAttribute('text-anchor', 'middle');
        xLabelText.setAttribute('fill', '#6b7280');
        xLabelText.setAttribute('font-size', '12');
        xLabelText.textContent = xLabel;
        svg.appendChild(xLabelText);

        // Y-axis label (rotated)
        const yLabelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabelText.setAttribute('x', 15);
        yLabelText.setAttribute('y', height / 2);
        yLabelText.setAttribute('text-anchor', 'middle');
        yLabelText.setAttribute('fill', '#6b7280');
        yLabelText.setAttribute('font-size', '12');
        yLabelText.setAttribute('transform', `rotate(-90, 15, ${height / 2})`);
        yLabelText.textContent = yLabel;
        svg.appendChild(yLabelText);
    }

    showTooltip(svg, x, y, text) {
        // Remove existing tooltip
        this.hideTooltip(svg);

        const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tooltip.setAttribute('class', 'chart-tooltip');

        const lines = text.split('\n');
        const padding = 8;
        const lineHeight = 14;
        const tooltipWidth = Math.max(...lines.map(line => line.length * 7)) + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2;

        // Adjust position to keep tooltip in bounds
        let tooltipX = x - tooltipWidth / 2;
        let tooltipY = y - tooltipHeight - 10;

        if (tooltipX < 0) tooltipX = 5;
        if (tooltipY < 0) tooltipY = y + 20;

        // Background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', tooltipX);
        bg.setAttribute('y', tooltipY);
        bg.setAttribute('width', tooltipWidth);
        bg.setAttribute('height', tooltipHeight);
        bg.setAttribute('fill', '#374151');
        bg.setAttribute('rx', '4');
        bg.setAttribute('opacity', '0.9');
        tooltip.appendChild(bg);

        // Text lines
        lines.forEach((line, i) => {
            const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('x', tooltipX + padding);
            textEl.setAttribute('y', tooltipY + padding + (i + 1) * lineHeight);
            textEl.setAttribute('fill', 'white');
            textEl.setAttribute('font-size', '11');
            textEl.textContent = line;
            tooltip.appendChild(textEl);
        });

        svg.appendChild(tooltip);
    }

    hideTooltip(svg) {
        const tooltip = svg.querySelector('.chart-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }



    showLoading() {
        try {
            const loadingState = document.getElementById('loadingState');
            const errorState = document.getElementById('errorState');
            const profileContent = document.getElementById('profileContent');

            if (loadingState) loadingState.style.display = 'block';
            if (errorState) errorState.style.display = 'none';
            if (profileContent) profileContent.style.display = 'none';
        } catch (error) {
            console.error('Error in showLoading:', error);
        }
    }

    showError(message) {
        try {
            const loadingState = document.getElementById('loadingState');
            const errorState = document.getElementById('errorState');
            const profileContent = document.getElementById('profileContent');
            const errorMessage = document.getElementById('errorMessage');

            if (errorMessage) errorMessage.textContent = message;
            if (loadingState) loadingState.style.display = 'none';
            if (errorState) errorState.style.display = 'block';
            if (profileContent) profileContent.style.display = 'none';
        } catch (error) {
            console.error('Error in showError:', error);
        }
    }

    showProfile() {
        try {
            const loadingState = document.getElementById('loadingState');
            const errorState = document.getElementById('errorState');
            const profileContent = document.getElementById('profileContent');

            if (loadingState) loadingState.style.display = 'none';
            if (errorState) errorState.style.display = 'none';
            if (profileContent) profileContent.style.display = 'block';
        } catch (error) {
            console.error('Error in showProfile:', error);
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    calculateAuditRatio(stats) {
        // Zone01 audit ratio formula: totalUp / totalDown
        // If totalDown is 0 but totalUp > 0, ratio is 1.0 (perfect)
        // If both are 0, ratio is 0
        const totalUp = stats.totalUp || 0;
        const totalDown = stats.totalDown || 0;

        if (totalDown === 0) {
            return totalUp > 0 ? 1.0 : 0;
        }

        return totalUp / totalDown;
    }

    calculateLevel(xp) {
        // Zone01 level calculation algorithm
        // Based on the formula used by 01 schools: level = floor(sqrt(xp / 500))
        // This matches the actual Zone01 leveling system
        if (xp <= 0) return 0;

        // The Zone01 formula: level = floor(sqrt(xp / 500))
        const level = Math.floor(Math.sqrt(xp / 500));

        // Ensure minimum level is 1 if there's any XP
        return Math.max(1, level);
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProfileManager();
});
