export async function sendAlimtalk(bookingData: {
  customerName: string
  customerPhone: string
  storeName: string
  menuName: string
  bookingDate: string
  bookingTime: string
  price: number
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) return

  try {
    await fetch(`${apiUrl}/notifications/alimtalk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: 'booking_confirmed',
        phone: bookingData.customerPhone,
        variables: {
          customer_name: bookingData.customerName,
          store_name: bookingData.storeName,
          menu_name: bookingData.menuName,
          booking_date: bookingData.bookingDate,
          booking_time: bookingData.bookingTime,
          price: bookingData.price.toLocaleString(),
        },
      }),
    })
  } catch (e) {
    console.error('알림톡 발송 실패:', e)
  }
}
