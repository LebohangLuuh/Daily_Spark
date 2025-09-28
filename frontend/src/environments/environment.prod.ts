export const environment = {
    production: true,
    apiUrl: (window as any).env?.API_URL || 'https://daily-spark-vuba.onrender.com/api'
};