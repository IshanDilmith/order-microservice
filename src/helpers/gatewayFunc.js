const axios = require('axios');

// Helper: make authenticated call via gateway
async function callViaGateway(method, path, data = {}, headers = {}) {
  try {
    const response = await axios({
      method,
      url: `${process.env.GATEWAY_URL}${path}`,
      data,
      headers: { Authorization: headers.authorization || '' }
    });
    return response.data;
  } catch (err) {
    console.error(`Gateway call failed: ${path}`, err.message);
    throw err;
  }
}

module.exports = { callViaGateway };