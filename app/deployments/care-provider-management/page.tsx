import { permanentRedirect } from 'next/navigation'

export default function CareProviderManagementPage() {
  return permanentRedirect('/deployments/care-provider-management/care-providers')
}
