import { useProductModalStore } from '../store/productModalStore'

export function useProductModal() {
  const selectedProduct = useProductModalStore((s) => s.selectedProduct)
  const openModal = useProductModalStore((s) => s.open)
  const closeModal = useProductModalStore((s) => s.close)
  return { selectedProduct, openModal, closeModal }
}
