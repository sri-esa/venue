"use strict";
// shared/types/attendee-personalization.types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationFrequency = exports.MobilityNeed = exports.DietaryPreference = exports.TicketTier = void 0;
// Since we cannot modify AttendeeProfile directly, we import if applicable, or assume it extends the base entity implicitly if not defined here.
// Assuming basic placeholder for AttendeeProfile if it's imported from another file, but we'll declare it standalone per instructions.
var TicketTier;
(function (TicketTier) {
    TicketTier["STANDARD"] = "STANDARD";
    TicketTier["PREMIUM"] = "PREMIUM";
    TicketTier["VIP"] = "VIP";
    TicketTier["ACCESSIBLE"] = "ACCESSIBLE";
})(TicketTier || (exports.TicketTier = TicketTier = {}));
var DietaryPreference;
(function (DietaryPreference) {
    DietaryPreference["VEGETARIAN"] = "VEGETARIAN";
    DietaryPreference["VEGAN"] = "VEGAN";
    DietaryPreference["HALAL"] = "HALAL";
    DietaryPreference["KOSHER"] = "KOSHER";
    DietaryPreference["GLUTEN_FREE"] = "GLUTEN_FREE";
    DietaryPreference["NONE"] = "NONE";
})(DietaryPreference || (exports.DietaryPreference = DietaryPreference = {}));
var MobilityNeed;
(function (MobilityNeed) {
    MobilityNeed["STANDARD"] = "STANDARD";
    MobilityNeed["WHEELCHAIR"] = "WHEELCHAIR";
    MobilityNeed["LIMITED_MOBILITY"] = "LIMITED_MOBILITY";
    MobilityNeed["VISUAL_IMPAIRMENT"] = "VISUAL_IMPAIRMENT";
})(MobilityNeed || (exports.MobilityNeed = MobilityNeed = {}));
var NotificationFrequency;
(function (NotificationFrequency) {
    NotificationFrequency["ALL"] = "ALL";
    NotificationFrequency["IMPORTANT_ONLY"] = "IMPORTANT_ONLY";
    NotificationFrequency["NONE"] = "NONE";
})(NotificationFrequency || (exports.NotificationFrequency = NotificationFrequency = {}));
