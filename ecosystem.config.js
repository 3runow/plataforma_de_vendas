module.exports = {
  apps: [
    {
      name: "oficialbricks",
      script: "npm run start",
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: "72.60.150.169",
      ref: "origin/main",
      repo: "git@github.com:3runow/plataforma_de_vendas.git",
      path: "/var/www/oficialbricks",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production"
    }
  }
}
