// Zone01 Kisumu GraphQL API Service
class GraphQLAPI {
    constructor() {
        this.endpoint = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';
        this.token = localStorage.getItem('jwt_token');
    }

    async makeRequest(query, variables = {}) {
        if (!this.token) {
            throw new Error('No authentication token available');
        }

        try {
            const response = await fetch(this.endpoint, {
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
                }
            }
        `;

        const data = await this.makeRequest(query, { userId: parseInt(userId) });
        return data.user[0] || null;
    }

    async getUserProgress(userId, limit = 20) {
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

    async getUserResults(userId, limit = 20) {
        const query = `
            query GetResults($userId: Int!, $limit: Int!) {
                result(
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
        return data.result || [];
    }

    async getUserTransactions(userId, limit = 50) {
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

    // Get user ID from JWT token
    getUserIdFromToken() {
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return payload.sub || payload['https://hasura.io/jwt/claims']['x-hasura-user-id'];
        } catch (error) {
            console.error('Error extracting user ID from token:', error);
            return null;
        }
    }

    // Process and aggregate user data
    async getProfileData() {
        const userId = this.getUserIdFromToken();
        if (!userId) {
            throw new Error('Unable to extract user ID from token');
        }

        console.log('Fetching profile data for user ID:', userId);

        try {
            // Fetch all data in parallel
            const [userInfo, progress, results, transactions] = await Promise.all([
                this.getUserInfo(userId),
                this.getUserProgress(userId),
                this.getUserResults(userId),
                this.getUserTransactions(userId)
            ]);

            // Process the data
            const profileData = this.processProfileData({
                user: userInfo,
                progress: progress,
                results: results,
                transactions: transactions
            });
            return profileData;

        } catch (error) {
            console.error('Error fetching profile data:', error);
            throw error;
        }
    }

    processProfileData(rawData) {
        const { user, progress, results, transactions } = rawData;

        // Process XP transactions
        const xpTransactions = transactions.filter(t => t.type === 'xp');
        const totalXP = xpTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

        // Process audit transactions
        const auditTransactions = transactions.filter(t => ['up', 'down'].includes(t.type));
        const upVotes = auditTransactions.filter(t => t.type === 'up').length;
        const downVotes = auditTransactions.filter(t => t.type === 'down').length;

        // Calculate audit ratio (simplified version)
        const totalAuditVotes = upVotes + downVotes;
        const auditRatio = totalAuditVotes > 0 ? upVotes / totalAuditVotes : 0;

        // Process projects (from progress data)
        const projects = progress.filter(p => p.object && p.object.type === 'project');
        const currentProject = projects[0]; // Most recent
        const completedProjects = projects.filter(p => p.grade !== null && p.grade > 0);

        // Process skills (derive from paths)
        const skillPaths = progress.map(p => p.path).filter(Boolean);
        const skills = this.extractSkillsFromPaths(skillPaths);

        // Create timeline data for charts
        const timelineData = this.createTimelineData(progress, results);

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
                completedProjects: completedProjects.length,
                upVotes: upVotes,
                downVotes: downVotes,
                auditRatio: auditRatio,
                totalAuditVotes: totalAuditVotes
            },
            currentProject: currentProject ? {
                name: currentProject.object.name,
                startDate: new Date(currentProject.createdAt).toLocaleDateString(),
                status: currentProject.grade !== null ? 'completed' : 'in-progress'
            } : null,
            recentProject: completedProjects[0] ? {
                name: completedProjects[0].object.name,
                completedDate: new Date(completedProjects[0].createdAt).toLocaleDateString(),
                grade: completedProjects[0].grade
            } : null,
            skills: skills,
            timeline: timelineData
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

    createTimelineData(progress, results) {
        const allData = [...progress, ...results]
            .filter(item => item.createdAt && item.grade !== null)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return allData.map(item => ({
            date: item.createdAt,
            grade: item.grade,
            name: item.object?.name || 'Unknown',
            type: item.object?.type || 'unknown'
        }));
    }

    getInitials(firstName, lastName) {
        const first = firstName ? firstName.charAt(0).toUpperCase() : '';
        const last = lastName ? lastName.charAt(0).toUpperCase() : '';
        return first + last || 'U';
    }
}

// GraphQLAPI is now exported as ES6 module
