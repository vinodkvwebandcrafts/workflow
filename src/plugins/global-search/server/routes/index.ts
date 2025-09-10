export default [
  {
    method: 'GET',
    path: '/search',
    handler: 'search.index',
    config: {
      auth: false, // change to true if you need auth
    },
  },
];
