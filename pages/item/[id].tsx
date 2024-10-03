import { useRouter } from 'next/router';
import ItemDetailsPage from '@/components/item-details-page'

export default function ItemPage() {
  const router = useRouter();
  const { id } = router.query;

  return <ItemDetailsPage id={id as string} />
}