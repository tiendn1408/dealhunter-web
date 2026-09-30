"use client";

import { useState } from "react";
import { AlertRule, deleteAlert } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { formatVND, formatDate } from "@/lib/formatting";
import {
  TrendingDown,
  Target,
  History,
  Trash2,
  Clock,
} from "lucide-react";

interface ActiveAlertCardProps {
  rule: AlertRule;
  onRuleDeleted: (ruleId: string) => void;
}

export function ActiveAlertCard({ rule, onRuleDeleted }: ActiveAlertCardProps) {
  const { t, formatText } = useLanguage();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t.alerts.deleteRuleConfirm)) return;

    setDeleting(true);
    try {
      await deleteAlert(rule.id);
      onRuleDeleted(rule.id);
    } catch (err) {
      alert(t.alerts.deleteFailed);
      setDeleting(false);
    }
  };

  const getRuleDetails = () => {
    switch (rule.rule_type) {
      case "drop_percent":
        return {
          title: t.alerts.dropPercentTitle,
          description: formatText(t.alerts.dropPercentDesc, {
            threshold: rule.threshold_value,
          }),
          icon: TrendingDown,
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
        };
      case "target_price":
        return {
          title: t.alerts.targetPriceTitle,
          description: formatText(t.alerts.targetPriceDesc, {
            price: formatVND(rule.threshold_value),
          }),
          icon: Target,
          badgeColor: "bg-pine-50 text-pine-900 border-pine-200",
        };
      case "lowest_in_days":
        return {
          title: formatText(t.alerts.lowestDaysTitle, {
            threshold: rule.threshold_value,
          }),
          description: formatText(t.alerts.lowestDaysDesc, {
            threshold: rule.threshold_value,
          }),
          icon: History,
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
        };
      default:
        return {
          title: t.detail.smartAlertsTitle,
          description: `${rule.threshold_value}`,
          icon: Target,
          badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const details = getRuleDetails();
  const Icon = details.icon;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-slate-300">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-pine-50 text-pine-900 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-5 h-5 text-pine-900" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-900">{details.title}</h4>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${details.badgeColor}`}
            >
              {t.alerts.activeBadge}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {details.description}
          </p>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>
                {rule.expires_at
                  ? formatText(t.alerts.expiresAt, { date: formatDate(rule.expires_at) })
                  : t.alerts.noExpiry}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
          title={t.common.delete}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{deleting ? t.common.loading : t.common.delete}</span>
        </button>
      </div>
    </div>
  );
}
