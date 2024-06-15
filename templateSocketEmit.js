require("dotenv").config();

module.exports = (method, data, to = "abletonToTimer") => {
  return {
    to,
    projectId: process.env.PROJECT_ID,
    data: {
      method,
      data,
    },
  };
};
