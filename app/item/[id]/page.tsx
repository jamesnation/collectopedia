import ItemDetailsPage from '@/components/item-details'

export default function ItemPage({ params }: { params: { id: string } }) {
  return <ItemDetailsPage id={params.id} />
}