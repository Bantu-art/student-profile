// Zone01 Kisumu Profile Page Logic
class ProfilePage {
    constructor() {
        this.api = new GraphQLAPI();
        this.profileData = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!Auth.requireAuth()) {
            return;
        }

        // Initialize UI
        this.setupEventListeners();
        this.updateWelcomeMessage();
        this.loadProfileData();
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
            console.log('Loading profile data...');
            this.profileData = await this.api.getProfileData();
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
        this.updateElement('userProjects', stats.totalProjects);

        // Update current project
        if (currentProject) {
            this.updateElement('currentProject', currentProject.name);
            this.updateElement('currentProjectDate', `Started ${currentProject.startDate}`);
        }

        // Update recent project
        if (recentProject) {
            this.updateElement('recentProject', recentProject.name);
            this.updateElement('recentProjectDate', `Completed ${recentProject.completedDate}`);
            this.updateElement('recentGrade', `${(recentProject.grade * 100).toFixed(1)}%`);
        }

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
        this.generateProgressChart(timeline);
        this.generateGradeChart(timeline);
    }

    generateProgressChart(timeline) {
        const chartContainer = document.getElementById('progressChart');
        if (!chartContainer || !timeline.length) {
            chartContainer.innerHTML = '<p>No timeline data available</p>';
            return;
        }

        // Create SVG chart
        const svg = this.createSVGChart(400, 250);
        
        // Process timeline data for chart
        const chartData = this.processTimelineForChart(timeline);
        
        // Draw line chart
        this.drawLineChart(svg, chartData, 400, 250);
        
        chartContainer.innerHTML = '';
        chartContainer.appendChild(svg);
    }

    generateGradeChart(timeline) {
        const chartContainer = document.getElementById('gradeChart');
        if (!chartContainer || !timeline.length) {
            chartContainer.innerHTML = '<p>No grade data available</p>';
            return;
        }

        // Create SVG chart
        const svg = this.createSVGChart(400, 250);
        
        // Process grade distribution
        const gradeData = this.processGradeDistribution(timeline);
        
        // Draw bar chart
        this.drawBarChart(svg, gradeData, 400, 250);
        
        chartContainer.innerHTML = '';
        chartContainer.appendChild(svg);
    }

    createSVGChart(width, height) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.background = 'white';
        svg.style.borderRadius = '6px';
        return svg;
    }

    processTimelineForChart(timeline) {
        // Group by month and calculate average grade
        const monthlyData = {};
        
        timeline.forEach(item => {
            const date = new Date(item.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { grades: [], date: monthKey };
            }
            monthlyData[monthKey].grades.push(item.grade);
        });

        // Calculate averages
        return Object.values(monthlyData)
            .map(month => ({
                date: month.date,
                avgGrade: month.grades.reduce((sum, grade) => sum + grade, 0) / month.grades.length
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-6); // Last 6 months
    }

    processGradeDistribution(timeline) {
        const distribution = {
            'Excellent (>80%)': 0,
            'Good (60-80%)': 0,
            'Average (40-60%)': 0,
            'Below Average (<40%)': 0
        };

        timeline.forEach(item => {
            const percentage = item.grade * 100;
            if (percentage >= 80) distribution['Excellent (>80%)']++;
            else if (percentage >= 60) distribution['Good (60-80%)']++;
            else if (percentage >= 40) distribution['Average (40-60%)']++;
            else distribution['Below Average (<40%)']++;
        });

        return Object.entries(distribution).map(([label, count]) => ({ label, count }));
    }

    drawLineChart(svg, data, width, height) {
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        if (data.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#6b7280');
            text.textContent = 'No data available';
            svg.appendChild(text);
            return;
        }

        // Create scales
        const maxGrade = Math.max(...data.map(d => d.avgGrade));
        const xStep = chartWidth / (data.length - 1);

        // Draw axes
        this.drawAxes(svg, margin, chartWidth, chartHeight);

        // Draw line
        const pathData = data.map((d, i) => {
            const x = margin.left + (i * xStep);
            const y = margin.top + chartHeight - (d.avgGrade / maxGrade) * chartHeight;
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#667eea');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);

        // Draw points
        data.forEach((d, i) => {
            const x = margin.left + (i * xStep);
            const y = margin.top + chartHeight - (d.avgGrade / maxGrade) * chartHeight;
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#667eea');
            svg.appendChild(circle);
        });
    }

    drawBarChart(svg, data, width, height) {
        const margin = { top: 20, right: 20, bottom: 60, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        if (data.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', width / 2);
            text.setAttribute('y', height / 2);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#6b7280');
            text.textContent = 'No data available';
            svg.appendChild(text);
            return;
        }

        // Draw axes
        this.drawAxes(svg, margin, chartWidth, chartHeight);

        const maxCount = Math.max(...data.map(d => d.count));
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        // Draw bars
        data.forEach((d, i) => {
            const x = margin.left + (i * (barWidth + barSpacing)) + barSpacing / 2;
            const barHeight = (d.count / maxCount) * chartHeight;
            const y = margin.top + chartHeight - barHeight;

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', '#667eea');
            rect.setAttribute('rx', '2');
            svg.appendChild(rect);

            // Add count label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + barWidth / 2);
            text.setAttribute('y', y - 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#374151');
            text.setAttribute('font-size', '12');
            text.textContent = d.count;
            svg.appendChild(text);
        });
    }

    drawAxes(svg, margin, chartWidth, chartHeight) {
        // X-axis
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', margin.left);
        xAxis.setAttribute('y1', margin.top + chartHeight);
        xAxis.setAttribute('x2', margin.left + chartWidth);
        xAxis.setAttribute('y2', margin.top + chartHeight);
        xAxis.setAttribute('stroke', '#e5e7eb');
        xAxis.setAttribute('stroke-width', '1');
        svg.appendChild(xAxis);

        // Y-axis
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', margin.left);
        yAxis.setAttribute('y1', margin.top);
        yAxis.setAttribute('x2', margin.left);
        yAxis.setAttribute('y2', margin.top + chartHeight);
        yAxis.setAttribute('stroke', '#e5e7eb');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);
    }

    showLoading() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('profileContent').style.display = 'none';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'block';
        document.getElementById('profileContent').style.display = 'none';
    }

    showProfile() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';
    }
}

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfilePage();
});
