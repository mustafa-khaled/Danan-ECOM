/* ── Design System Core ── */
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Input } from "./Input";
export type { InputProps } from "./Input";

export { Alert } from "./Alert";
export type { AlertProps, AlertVariant } from "./Alert";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeVariant, BadgeSize } from "./Badge";

export { Modal } from "./Modal";
export type { ModalProps, ModalSize } from "./Modal";

/* ── Layout ── */
export { default as Container } from "./container";
export { default as SectionHead } from "./section-head";
export { SplitHeroLayout } from "./SplitHeroLayout";
export { AccountLayout } from "./AccountLayout";

/* ── Navigation ── */
export { SiteHeader } from "./SiteHeader";
export { SiteFooter } from "./SiteFooter";

/* ── Content ── */
export { PieceCard } from "./PieceCard";
export type { PieceCardData, PieceCardProps } from "./PieceCard";

export { CertificateModal } from "./CertificateModal";
export type {
  CertificateData,
  CertificateModalProps,
} from "./CertificateModal";

export { StatusPill } from "./StatusPill";
export type { StatusPillProps } from "./StatusPill";

export { SerialBadge } from "./SerialBadge";
export type { SerialBadgeProps } from "./SerialBadge";

export { OptimizedImage } from "./OptimizedImage";
export type { OptimizedImageProps } from "./OptimizedImage";

export { ArrowLink } from "./ArrowLink";
export type { ArrowLinkProps } from "./ArrowLink";

/* ── Feedback ── */
export { WelcomeModal, AccessGateHeader } from "./WelcomeModal";
