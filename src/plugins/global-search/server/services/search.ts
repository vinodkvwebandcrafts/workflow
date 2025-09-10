export default ({ strapi }) => ({
  async search(q: string) {
    // Perform search logic here
    return [{ title: 'Demo result', q }];
  },
});
