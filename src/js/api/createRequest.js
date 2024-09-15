const createRequest = async (options) => {
  return await fetch(
    "https://chat-backend-6287.onrender.com/new-user",
    options
  );
};

export default createRequest;
