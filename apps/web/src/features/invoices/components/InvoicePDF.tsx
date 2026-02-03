import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register a standard font (optional, helps with currency symbols)
Font.register({
  family: 'Helvetica',
  fonts: [{ src: 'https://fonts.gstatic.com/s/helvetica/v1/0.ttf' }]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logo: { fontSize: 20, fontWeight: 'bold', color: '#2563EB' },
  title: { fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', color: '#111' },
  
  section: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  label: { fontSize: 8, color: '#666', marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 'bold' },
  
  table: { width: '100%', marginTop: 20, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 8, borderBottom: '1px solid #E5E7EB' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottom: '1px solid #E5E7EB' },
  
  col1: { width: '40%' },
  col2: { width: '20%', textAlign: 'right' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  
  totals: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalRow: { flexDirection: 'row', marginBottom: 4 },
  totalLabel: { width: 100, textAlign: 'right', paddingRight: 10, color: '#666' },
  totalValue: { width: 80, textAlign: 'right', fontWeight: 'bold' },
  grandTotal: { width: 80, textAlign: 'right', fontWeight: 'bold', fontSize: 12, color: '#2563EB' },
});

interface InvoicePDFProps {
  invoice: any;
  settings: any; // <--- ✅ Added Settings Prop
}

// 1. Destructure settings here 👇
export const InvoicePDF = ({ invoice, settings }: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          {/* 2. Use Dynamic Settings 👇 */}
          <Text style={styles.logo}>{settings?.companyName || 'My Company'}</Text>
          <Text style={{ marginTop: 4, color: '#666' }}>{settings?.companyAddress}</Text>
          <Text style={{ color: '#666' }}>{settings?.companyEmail}</Text>
          {settings?.taxId && (
            <Text style={{ color: '#666', marginTop: 2 }}>Tax ID: {settings?.taxId}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={{ color: '#666', marginTop: 4 }}>#{invoice.number}</Text>
          <Text style={{ color: '#666' }}>Status: {invoice.status}</Text>
        </View>
      </View>

      <View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 20 }} />

      {/* Client & Dates */}
      <View style={styles.section}>
        <View>
          <Text style={styles.label}>BILL TO</Text>
          <Text style={styles.value}>{invoice.clientId?.name || 'Unknown Client'}</Text>
          <Text style={styles.value}>{invoice.clientId?.email}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.label, { textAlign: 'right' }]}>DATE</Text>
            <Text style={styles.value}>{new Date(invoice.date).toLocaleDateString()}</Text>
          </View>
          <View>
            <Text style={[styles.label, { textAlign: 'right' }]}>DUE DATE</Text>
            <Text style={styles.value}>{new Date(invoice.expiredDate).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>ITEM</Text>
          <Text style={styles.col2}>QTY</Text>
          <Text style={styles.col3}>PRICE</Text>
          <Text style={styles.col4}>TOTAL</Text>
        </View>

        {/* Table Rows */}
        {invoice.items.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{item.itemName}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>${item.price.toFixed(2)}</Text>
            <Text style={styles.col4}>${(item.quantity * item.price).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${invoice.subTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%):</Text>
            <Text style={styles.totalValue}>${invoice.taxTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount:</Text>
            <Text style={styles.totalValue}>-${invoice.discount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 4, borderTop: '1px solid #E5E7EB', paddingTop: 4 }]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.grandTotal}>${invoice.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

    </Page>
  </Document>
);