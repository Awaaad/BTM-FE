import { apiFetch } from './client'
import type { Beneficiary, BeneficiaryInput, BeneficiaryStatus } from '../types'

export function listBeneficiaries(
  search?: string,
  status?: BeneficiaryStatus,
): Promise<Beneficiary[]> {
  const params = new URLSearchParams()
  if (search?.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  const query = params.toString()
  return apiFetch<Beneficiary[]>(`/api/beneficiaries${query ? `?${query}` : ''}`)
}

export function createBeneficiary(input: BeneficiaryInput): Promise<Beneficiary> {
  return apiFetch<Beneficiary>('/api/beneficiaries', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateBeneficiary(id: number, input: BeneficiaryInput): Promise<Beneficiary> {
  return apiFetch<Beneficiary>(`/api/beneficiaries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteBeneficiary(id: number): Promise<void> {
  return apiFetch<void>(`/api/beneficiaries/${id}`, { method: 'DELETE' })
}
