import { permanentRedirect } from 'next/navigation'

export default function DeploymentsPage() {
  permanentRedirect('/deployments/list')
}
