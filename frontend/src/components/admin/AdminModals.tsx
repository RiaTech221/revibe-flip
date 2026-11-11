import React from 'react';
import {
  AdminUserDetail,
  Product,
  Category,
  Order,
  DeliveryStatus,
  ReportStatus,
} from '../../types';
import {
  UserDetailModal,
  ProductDetailModal,
  CategoryModal,
  DeliveryModal,
  ReportResolutionModal,
  AuditConversationModal,
} from './modals';

interface AdminModalsProps {
  // Modal 1: User Detail
  selectedUserDetail: AdminUserDetail | null;
  onCloseUserDetail: () => void;

  // Modal 2: Product Detail
  selectedProductDetail: Product | null;
  onCloseProductDetail: () => void;
  onDeleteProduct: (id: number) => void;
  onProductStatus: (id: number, newStatus: string) => void;

  // Modal 3: Category
  isCategoryModalOpen: boolean;
  editingCategory: Category | null;
  catName: string;
  setCatName: (name: string) => void;
  catSlug: string;
  setCatSlug: (slug: string) => void;
  catDesc: string;
  setCatDesc: (desc: string) => void;
  actionLoading: boolean;
  onCloseCategoryModal: () => void;
  onSaveCategory: (e: React.FormEvent) => void;

  // Modal 4: Delivery
  selectedOrderForDelivery: Order | null;
  newDeliveryStatus: DeliveryStatus;
  setNewDeliveryStatus: (status: DeliveryStatus) => void;
  deliveryNote: string;
  setDeliveryNote: (note: string) => void;
  onCloseDeliveryModal: () => void;
  onSaveDeliveryStatus: (e: React.FormEvent) => void;

  // Modal 5: Report
  selectedReport: any | null;
  reportAction: string;
  setReportAction: (action: string) => void;
  reportStatusChoice: ReportStatus;
  setReportStatusChoice: (status: ReportStatus) => void;
  reportAdminNotes: string;
  setReportAdminNotes: (notes: string) => void;
  onCloseReportModal: () => void;
  onSaveReportResolution: (e: React.FormEvent) => void;

  // Modal 6: Audit Conversation
  auditConversationModal: {
    isOpen: boolean;
    data: any | null;
    loading: boolean;
  };
  onCloseAuditConversationModal: () => void;

  formatPrice: (price?: number | null) => string;
}

/**
 * Orchestrateur principal des modales d'administration.
 * Délègue chaque boîte de dialogue à son sous-composant encapsulé dans `./modals/`.
 */
export const AdminModals: React.FC<AdminModalsProps> = ({
  selectedUserDetail,
  onCloseUserDetail,
  selectedProductDetail,
  onCloseProductDetail,
  onDeleteProduct,
  onProductStatus,
  isCategoryModalOpen,
  editingCategory,
  catName,
  setCatName,
  catSlug,
  setCatSlug,
  catDesc,
  setCatDesc,
  actionLoading,
  onCloseCategoryModal,
  onSaveCategory,
  selectedOrderForDelivery,
  newDeliveryStatus,
  setNewDeliveryStatus,
  deliveryNote,
  setDeliveryNote,
  onCloseDeliveryModal,
  onSaveDeliveryStatus,
  selectedReport,
  reportAction,
  setReportAction,
  reportStatusChoice,
  setReportStatusChoice,
  reportAdminNotes,
  setReportAdminNotes,
  onCloseReportModal,
  onSaveReportResolution,
  auditConversationModal,
  onCloseAuditConversationModal,
  formatPrice,
}) => {
  return (
    <>
      <UserDetailModal
        userDetail={selectedUserDetail}
        onClose={onCloseUserDetail}
        formatPrice={formatPrice}
      />

      <ProductDetailModal
        productDetail={selectedProductDetail}
        onClose={onCloseProductDetail}
        onDeleteProduct={onDeleteProduct}
        onProductStatus={onProductStatus}
        formatPrice={formatPrice}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        editingCategory={editingCategory}
        catName={catName}
        setCatName={setCatName}
        catSlug={catSlug}
        setCatSlug={setCatSlug}
        catDesc={catDesc}
        setCatDesc={setCatDesc}
        actionLoading={actionLoading}
        onClose={onCloseCategoryModal}
        onSave={onSaveCategory}
      />

      <DeliveryModal
        order={selectedOrderForDelivery}
        newDeliveryStatus={newDeliveryStatus}
        setNewDeliveryStatus={setNewDeliveryStatus}
        deliveryNote={deliveryNote}
        setDeliveryNote={setDeliveryNote}
        actionLoading={actionLoading}
        onClose={onCloseDeliveryModal}
        onSave={onSaveDeliveryStatus}
      />

      <ReportResolutionModal
        report={selectedReport}
        reportAction={reportAction}
        setReportAction={setReportAction}
        reportStatusChoice={reportStatusChoice}
        setReportStatusChoice={setReportStatusChoice}
        reportAdminNotes={reportAdminNotes}
        setReportAdminNotes={setReportAdminNotes}
        actionLoading={actionLoading}
        onClose={onCloseReportModal}
        onSave={onSaveReportResolution}
      />

      <AuditConversationModal
        modal={auditConversationModal}
        onClose={onCloseAuditConversationModal}
      />
    </>
  );
};

export default AdminModals;
