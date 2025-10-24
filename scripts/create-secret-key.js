const {
  createApiKeysWorkflow,
} = require("@medusajs/medusa/core-flows")

/**
 * @param {import("@medusajs/framework/types").ExecArgs} opts
 */
async function createSecretApiKey({ container, logger }) {
  const { result } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "CLI Secret",
          type: "secret",
          created_by: "medusa exec scripts/create-secret-key.js",
        },
      ],
    },
  })

  const key = result?.[0]
  if (!key) {
    throw new Error("createApiKeysWorkflow returned no api keys")
  }

  logger?.info(`Secret API key id: ${key.id}`)
  if (key.token) {
    console.log(`SECRET_API_KEY=${key.token}`)
  } else {
    console.log(
      "Key created but token was not returned. Ensure you're on Medusa >= 2.2.0."
    )
  }
}

module.exports = {
  default: createSecretApiKey,
}
