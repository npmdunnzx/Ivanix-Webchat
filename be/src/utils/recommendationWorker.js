import cron from "node-cron";
import recommendationService from "../services/recommendation.service.js";

const startRecommendationWorker = () => {
  // Chạy ngay khi server khởi động, để không phải đợi tới lần cron đầu tiên
  // mới có dữ liệu cho user test/dùng thử.
  recommendationService.computeStaticFeatures().catch((err) => {
    console.error("Initial recommendation computation failed:", err);
  });

  // Cứ 2 giờ chạy lại 1 lần để cập nhật feature (bạn mới, nhóm mới, tin nhắn mới...).
  cron.schedule("0 */2 * * *", async () => {
    console.log("[Cron] Recomputing recommendation features...");
    await recommendationService.computeStaticFeatures();
  });
};

export default startRecommendationWorker;