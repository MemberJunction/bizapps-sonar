import { Injectable } from "@angular/core";
import { MJNotificationService } from "@memberjunction/ng-notifications";

/**
 * Thin wrapper over MJ's toast notifications ({@link MJNotificationService.CreateSimpleNotification},
 * a lightweight DOM toast that is NOT persisted to the User Notifications table). One seam for all
 * Sonar surfaces so action outcomes (recompute, publish, simulate) surface consistently.
 */
@Injectable({ providedIn: "root" })
export class ToastService {
    /** Green success toast (auto-hides). */
    public success(message: string, hideAfter = 4000): void {
        MJNotificationService.Instance.CreateSimpleNotification(message, "success", hideAfter);
    }
    /** Red error toast (lingers a little longer so it isn't missed). */
    public error(message: string, hideAfter = 6000): void {
        MJNotificationService.Instance.CreateSimpleNotification(message, "error", hideAfter);
    }
    /** Amber warning toast. */
    public warning(message: string, hideAfter = 5000): void {
        MJNotificationService.Instance.CreateSimpleNotification(message, "warning", hideAfter);
    }
    /** Neutral info toast. */
    public info(message: string, hideAfter = 4000): void {
        MJNotificationService.Instance.CreateSimpleNotification(message, "info", hideAfter);
    }
}
