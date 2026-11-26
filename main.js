import './style.css'
import { createRoomViewer } from './src/room3d.js'
import { setupInquiryForm } from './src/inquiry-form.js'
import {
  setupGalleryFilter,
  setupHeader,
  setupRevealOnScroll,
  setupSwatches,
  setupRoomControls,
  flashFinishGroup,
  setActiveView,
  setActiveLight,
  setTourActive,
  setupRoomTools,
  setupScrollProgress,
  setupHeadlineSplit,
  setupCountUp,
  setupTilt,
  setupParallax,
  setupLightbox,
  setupRoomPicker,
  showEditSelection,
  setupPanelToggle,
} from './src/site-ui.js'

setupHeadlineSplit()
setupHeader()
setupScrollProgress()
setupCountUp()
setupTilt()
setupParallax()
setupLightbox()
setupGalleryFilter()
setupRevealOnScroll()
setupInquiryForm(document.querySelector('#inquiry-form'))
document.querySelector('#year').textContent = new Date().getFullYear()

const roomViewer = createRoomViewer(document.querySelector('#room-canvas'), {
  onSelect: flashFinishGroup,
  onViewChange: setActiveView,
  onLightingChange: setActiveLight,
  onTourChange: setTourActive,
  onEditSelect: showEditSelection,
})
setupSwatches((target, color) => roomViewer?.setColor(target, color))
setupRoomControls(roomViewer)
setupRoomTools(roomViewer)
setupRoomPicker(roomViewer)
setupPanelToggle()
