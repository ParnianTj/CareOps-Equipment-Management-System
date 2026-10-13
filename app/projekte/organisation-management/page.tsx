import { permanentRedirect } from 'next/navigation'

export default function OrganisationManagementPage() {
  return permanentRedirect('/projekte/organisation-management/organisation')
}
