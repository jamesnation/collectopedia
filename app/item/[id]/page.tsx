import ItemDetailsPage from '@/components/item-details-page'

export default function ItemPage({ params }: { params: { id: string } }) {
  return <ItemDetailsPage id={params.id} />
}