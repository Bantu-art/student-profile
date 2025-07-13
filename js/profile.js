// Zone01 Kisumu Profile Page Logic
class ProfilePage {
    constructor() {
        this.api = new GraphQLAPI();
        this.profileData = null;

        // Initialize immediately since we're called after window load
        this.init();
    }

    init() {
        console.log('ProfilePage initializing...');

        // Check authentication first
        if (!Auth.requireAuth()) {
            console.log('Authentication failed, redirecting...');
            return;
        }

        // Setup event listeners
        this.setupEventListeners();
        this.updateWelcomeMessage();

        // Load data after a small delay to ensure everything is ready
        setTimeout(() => {
            this.loadProfileData();
        }, 500);
    }

    setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            Auth.logout();
        });

        // Retry button
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.loadProfileData();
        });

        // Refresh stats button
        document.getElementById('refreshStats').addEventListener('click', () => {
            this.loadProfileData();
        });
    }

    updateWelcomeMessage() {
        const username = Auth.getUsername();
        const welcomeElement = document.getElementById('welcomeUser');
        if (welcomeElement && username) {
            welcomeElement.textContent = `Welcome, ${username}`;
        }
    }

    async loadProfileData() {
        this.showLoading();

        try {
            // Debug: Check what user ID we're using
            const userId = this.api.getUserIdFromToken();
            console.log('🔍 Extracted User ID from token:', userId);

            // Debug: Check token payload
            const token = Auth.getToken();
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    console.log('🔍 Full JWT payload:', payload);
                } catch (e) {
                    console.error('Error parsing token:', e);
                }
            }

            this.profileData = await this.api.getProfileData();
            console.log('🔍 Fetched profile data:', this.profileData);

            this.displayProfileData();
            this.showProfile();
        } catch (error) {
            console.error('Failed to load profile data:', error);
            this.showError(error.message);
        }
    }

    displayProfileData() {
        if (!this.profileData) return;

        const { user, stats, currentProject, recentProject, skills, timeline } = this.profileData;

        // Update user information
        this.updateElement('userName', user.name);
        this.updateElement('userEmail', user.email);
        this.updateElement('userJoinDate', `Member since ${user.joinDate}`);
        this.updateElement('userInitials', user.initials);
        this.updateElement('userXP', stats.totalXP.toLocaleString());

        // Update audit information
        const auditRatio = this.calculateAuditRatio(stats);
        this.updateElement('auditRatio', auditRatio.toFixed(1));
        this.updateElement('auditRatioDisplay', auditRatio.toFixed(2));
        this.updateElement('upVotes', stats.upVotes || 0);
        this.updateElement('downVotes', stats.downVotes || 0);

        // Update audit performance
        this.updateAuditPerformance(auditRatio);

        // Update skills
        this.updateSkillsDisplay(skills);

        // Generate charts
        this.generateCharts(timeline, stats);
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
        const skillsContainer = document.querySelector('.skills-container');
        if (!skillsContainer || !skills.length) return;

        // Clear existing skills
        skillsContainer.innerHTML = '';

        // Add skills based on actual data
        skills.forEach(skill => {
            const skillElement = this.createSkillElement(skill);
            skillsContainer.appendChild(skillElement);
        });
    }

    createSkillElement(skill) {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-item';

        const skillName = skill.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const skillLevel = this.getSkillLevel(skill.count);
        const skillProgress = Math.min((skill.count / 10) * 100, 100); // Max 100%

        skillDiv.innerHTML = `
            <span class="skill-name">${skillName}</span>
            <div class="skill-progress">
                <div class="skill-bar" style="width: ${skillProgress}%;"></div>
            </div>
            <span class="skill-level">${skillLevel}</span>
        `;

        return skillDiv;
    }

    getSkillLevel(count) {
        if (count >= 20) return 'Expert';
        if (count >= 10) return 'Advanced';
        if (count >= 5) return 'Intermediate';
        if (count >= 2) return 'Beginner';
        return 'Learning';
    }

    generateCharts(timeline, stats) {
        // Generate enhanced charts with better data
        this.generateXPProgressChart();
        this.generateAuditActivityChart();
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
        console.log('Showing loading state');
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
        console.log('Showing error state:', message);
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
        console.log('Showing profile content');
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
}

// ProfilePage class is now initialized manually from HTML
