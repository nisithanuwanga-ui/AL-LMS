# Backend administration

## Provisioning the initial administrator

There is deliberately no public administrator registration endpoint. To provision an
administrator, run the one-time CLI from the `backend` directory:

```text
node scripts/createAdmin.js
```

Provide `MONGODB_URI` to the process through your deployment platform's secret
environment configuration or another approved secure environment-injection
mechanism. The utility does not load or edit `.env` files and does not accept a
database URI as a command-line argument. Do not place the URI or account password
in shell command history.

The CLI prompts for the administrator's name and email and prompts for the
password twice without echoing password characters. It refuses to use an email
already assigned to any account, creates the user through the existing Mongoose
`User` model, and relies on its password hashing hook. No default password is
created or printed. Run this only from an authorized administrative environment.
