import type { FastifyInstance } from "fastify";
import { checkToken } from "../../shared/middlewares/check_token.js";
import { NotificationController } from "./notification.controller.js";
import {
	deleteAllNotificationsSchemaSwagger,
	deleteNotificationSchemaSwagger,
	getNotificationsSchemaSwagger,
	readAllNotificationsSchemaSwagger,
} from "./notification.swagger.js";

export async function notificationRoutes(app: FastifyInstance) {
	app.get(
		"/",
		{ ...getNotificationsSchemaSwagger, preHandler: [checkToken] },
		NotificationController.getNotifications,
	);
	app.patch(
		"/read-all",
		{ ...readAllNotificationsSchemaSwagger, preHandler: [checkToken] },
		NotificationController.readAllNotifications,
	);
	app.delete(
		"/delete/:id",
		{ ...deleteNotificationSchemaSwagger, preHandler: [checkToken] },
		NotificationController.deleteNotification,
	);
	app.delete(
		"/delete-all",
		{ ...deleteAllNotificationsSchemaSwagger, preHandler: [checkToken] },
		NotificationController.deleteAllNotifications,
	);
}
