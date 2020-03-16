module.exports = {
  get eob_url() {
    return process.env['EOB_URL'] || null;
  },
};

