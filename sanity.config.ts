import { createClient } from '@sanity/client'

export const client = createClient({
  projectId: '0hcfi5z2',
  dataset: 'production',
  apiVersion: '2024-03-19',
  useCdn: true,
  perspective: 'published'
})