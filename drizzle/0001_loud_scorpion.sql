ALTER TABLE "ai_messages" ADD COLUMN "provider" varchar(50);--> statement-breakpoint
ALTER TABLE "ai_messages" ADD COLUMN "model" varchar(100);--> statement-breakpoint
ALTER TABLE "ai_usage_tracking" ADD COLUMN "provider" varchar(50);--> statement-breakpoint
ALTER TABLE "ai_usage_tracking" ADD COLUMN "model" varchar(100);