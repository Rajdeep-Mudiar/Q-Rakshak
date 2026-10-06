// Common UI & Modals
export { default as AuthModal } from "./common/AuthModal.jsx";
export { default as ProfileSettingsModal } from "./common/ProfileSettingsModal.jsx";
export { default as UserGuideModal } from "./common/UserGuideModal.jsx";
export { default as SectionGuideModal } from "./common/SectionGuideModal.jsx";
export { default as VideoWalkthroughModal } from "./common/VideoWalkthroughModal.jsx";

// Visualizations
export { default as DigitalTwin3D } from "./visualizations/DigitalTwin3D.jsx";
export { default as ExplainabilityView } from "./visualizations/ExplainabilityView.jsx";
export { default as BenchmarkMatrix } from "./visualizations/BenchmarkMatrix.jsx";
export { default as EarlyDetectionMap } from "./visualizations/EarlyDetectionMap.jsx";
export { default as QuantumCircuitViewer } from "./visualizations/QuantumCircuitViewer.jsx";

// Feature Consoles & Views (re-exported from features for backward compatibility)
export { default as PatientPortal } from "../features/clinical/PatientPortal.jsx";
export { default as UserManagementConsole } from "../features/admin/UserManagementConsole.jsx";
export { default as ComplianceConsole } from "../features/admin/ComplianceConsole.jsx";
export { default as UserProfilePage } from "../features/profile/UserProfilePage.jsx";
export { default as ResearcherConsole } from "../features/researcher/ResearcherConsole.jsx";