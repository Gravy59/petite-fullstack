const address = "http://127.0.0.1:8090";
const collection = "messages";
const client = new PocketBase(address);

function pageData() {
  return {
    authForm: {
      email: null,
      password: null,
      passwordConfirm: null,
      username: null,
      loginMessage: null,
    },

    async login() {
      try {
        await client
          .collection("users")
          .authWithPassword(this.authForm.email, this.authForm.password);
        this.showLogin = false;
        this.authForm.email = "";
        this.authForm.password = "";
        window.location.reload(true);
      } catch (err) {
        this.authForm.loginMessage = err;
      }
    },

    async signUp() {
      try {
        const createdUser = await client.collection("users").create({
          email: this.authForm.email,
          emailVisibility: false,
          password: this.authForm.password,
          passwordConfirm: this.authForm.passwordConfirm,
          name: this.authForm.username,
        });
        window.location.reload(true);
        this.authForm.email = "";
        this.authForm.password = "";
        this.authForm.passwordConfirm = "";
        this.authForm.username = "";
      } catch (err) {
        this.authForm.loginMessage = err;
      }
    },

    messages: [],
    text: "",
    user: client.authStore.model,

    showLogin: window.localStorage.getItem("pocketbase_auth") ? false : true,

    async getMessages() {
      const records = await client.collection("messages").getFullList({
        sort: "created",
        expand: "user",
      });
      this.messages = records;
    },

    async subscribe() {
      client
        .collection("messages")
        .subscribe("*", async ({ action, record }) => {
          if (action === "create") {
            const user = await client.collection("users").getOne(record.user);
            record.expand = { user: [user] };
            this.messages.push(record);
          }
          if (action === "delete") {
            this.messages = this.messages.filter((m) => m.id !== record.id);
          }
        });
    },

    async submitData() {
      const data = {
        text: this.text,
        user: [client.authStore.model.id],
      };
      const record = await client.collection("messages").create(data);
      this.text = "";
    },

    async deleteMsg(id) {
      try {
        await client.collection("messages").delete(id);
      } catch (err) {
        console.log("ERR", err);
      }
    },

    async logout() {
      await client.authStore.clear();
      this.showLogin = true;
    },
  };
}
