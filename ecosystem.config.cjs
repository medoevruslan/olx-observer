module.exports = {
  apps: [
    {
      name: "olx-bot",
      script: "index.ts",
      interpreter: "node",
      node_args: [
        "--experimental-strip-types", // Node 22+
      ],
      watch: false,
      autorestart: true,
    },
  ],
};
