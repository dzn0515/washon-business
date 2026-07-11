import type { ReactNode } from 'react'
import Modal from '@/components/ui/Modal'

interface AdminModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function AdminModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: AdminModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size={size}>
      {children}
      {footer && <div className="mt-4 pt-4 border-t border-gray-100">{footer}</div>}
    </Modal>
  )
}
