import { MapPin, Phone, Clock, MessageCircle, Navigation, Heart, Lock } from "lucide-react";
import { Button } from "./ui";
import { useI18n } from "../context/I18nContext";
import { clinicAddress, clinicMapsUrl, clinicPhone, telHref, whatsappUrl } from "../lib/utils";

const CURRENT_YEAR = new Date().getFullYear();

const LEGACY_PLACEHOLDER_ADDRESS = "Gurukrupa Clinic, Station Road, Rajkot - 360001";
const LEGACY_PLACEHOLDER_PHONE = "+91 98765 43210";

export default function Footer({ settings, onOpenStaffModal }) {
  const { t } = useI18n();
  const configuredAddress = settings?.address?.trim();
  const address =
    !configuredAddress || configuredAddress === LEGACY_PLACEHOLDER_ADDRESS
      ? clinicAddress
      : configuredAddress;
  const phone =
    !settings?.phone || settings.phone === LEGACY_PLACEHOLDER_PHONE
      ? clinicPhone
      : settings.phone;
  const maps = clinicMapsUrl;
  const wa = whatsappUrl(phone, "Hello Gurukrupa Clinic, I would like to enquire about my token.");

  return (
    <footer className="no-print mt-auto border-t border-[var(--border)] bg-[var(--bg-elevated)]/80 py-10 text-xs text-[var(--fg-muted)] backdrop-blur-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Clinic Address & Contact */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-extrabold text-[var(--fg)] tracking-tight">
              {settings?.clinic_name || "Gurukrupa Clinic"}
            </h4>
            <p className="flex items-start gap-2.5 text-xs text-[var(--fg-secondary)] leading-relaxed">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E4572E]" strokeWidth={2} />
              <span>{address}</span>
            </p>
            <a
              href={telHref(phone)}
              className="inline-flex items-center gap-2 font-bold text-[var(--fg)] hover:text-[#E4572E] transition-colors"
            >
              <Phone className="h-4 w-4 text-[#E4572E]" strokeWidth={2} />
              <span>{phone}</span>
            </a>
          </div>

          {/* Timings & Sessions */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-extrabold text-[var(--fg)] tracking-tight">
              <Clock className="h-4 w-4 text-[#F4A62A]" strokeWidth={2} />
              <span>{t("footer.timings")}</span>
            </h4>
            <div className="space-y-1 text-xs text-[var(--fg-secondary)]">
              <p>
                <strong className="text-[#F4A62A] font-bold">Morning:</strong>{" "}
                {settings?.morning_start_time || "09:00 AM"} – {settings?.morning_end_time || "01:00 PM"}{" "}
                <span className="text-[11px] text-[var(--fg-muted)]">(Quota: 50 patients)</span>
              </p>
              <p>
                <strong className="text-[#183D6D] dark:text-[#CFE0F3] font-bold">Evening:</strong>{" "}
                {settings?.evening_start_time || "04:30 PM"} – {settings?.evening_end_time || "08:30 PM"}{" "}
                <span className="text-[11px] text-[var(--fg-muted)]">(Selected slot tokens)</span>
              </p>
            </div>
          </div>

          {/* Direct CTA links (Maps & WhatsApp) */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start md:items-end justify-start md:justify-end gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(maps, "_blank", "noopener,noreferrer")}
            >
              <Navigation className="h-3.5 w-3.5 text-[#14213D] dark:text-[#EAE2D3]" strokeWidth={2} />
              <span>{t("footer.maps")}</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.open(wa, "_blank", "noopener,noreferrer")}
            >
              <MessageCircle className="h-3.5 w-3.5 text-white" strokeWidth={2} />
              <span>{t("footer.whatsapp")}</span>
            </Button>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="mt-8 border-t border-[var(--border)] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--fg-muted)]">
          <span>&copy; {CURRENT_YEAR} Gurukrupa Clinic. All rights reserved.</span>
          <div className="flex items-center gap-4">
            {onOpenStaffModal && (
              <button
                type="button"
                onClick={onOpenStaffModal}
                className="inline-flex items-center gap-1.5 text-[var(--fg-muted)] hover:text-[#E4572E] transition-colors cursor-pointer"
              >
                <Lock className="h-3 w-3" />
                <span>Staff Access</span>
              </button>
            )}
            <span className="flex items-center gap-1">
              <span>Designed with</span>
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
              <span>for modern healthcare delivery</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
