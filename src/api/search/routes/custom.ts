export default {
    routes: [
        {
            method: 'GET',
            path: '/global-search',
            handler: 'search.globalSearch',
            config: {
                auth: false
            }
        }
    ]
}