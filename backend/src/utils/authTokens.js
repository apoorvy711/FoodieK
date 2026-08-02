const { generateAccessToken, generateRefreshToken } = require("./jwt");

function issueTokens(payload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

module.exports = {
  issueTokens,
};
