import Entity from "./Entity";
import createRequest from "./createRequest";

export default class ChatAPI extends Entity {
  async registerUser(options) {
    try {
      const response = await createRequest({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      const user = await response.json();
      return user;
    } catch (e) {
      console.log(e);
      return;
    }
  }
}
