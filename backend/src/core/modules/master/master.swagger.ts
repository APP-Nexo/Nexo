export const promoteUserSchemaSwagger = {
	schema: {
		tags: ["Master"],
		summary: "Promote user to admin",
		security: [{ bearerAuth: [] }],
		params: {
			type: "object",
			properties: {
				id: { type: "number" },
			},
		},
		response: {
			200: {
				type: "object",
				properties: {
					message: { type: "string" },
					email: { type: "string" },
					role: { type: "string" },
				},
			},
		},
	},
};

export const demoteUserSchemaSwagger = {
	schema: {
		tags: ["Master"],
		summary: "Demote user to user role",
		security: [{ bearerAuth: [] }],
		params: {
			type: "object",
			properties: {
				id: { type: "number" },
			},
		},
		response: {
			200: {
				type: "object",
				properties: {
					message: { type: "string" },
					email: { type: "string" },
					role: { type: "string" },
				},
			},
		},
	},
};

export const banUserSchemaSwagger = {
	schema: {
		tags: ["Master"],
		summary: "Soft ban user",
		security: [{ bearerAuth: [] }],
		params: {
			type: "object",
			properties: {
				id: { type: "number" },
			},
		},
		response: {
			200: {
				type: "object",
				properties: {
					message: { type: "string" },
					email: { type: "string" },
					bannedAt: { type: "string" },
				},
			},
		},
	},
};
