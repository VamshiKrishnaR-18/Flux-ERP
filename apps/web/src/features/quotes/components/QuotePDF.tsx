import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Quote } from '@erp/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2, color: '#111' },
  label: { fontSize: 8, color: '#666', marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 10, marginBottom: 12, fontWeight: 'bold' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8 },
  tableHeader: { backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#EEE', paddingVertical: 8 },
  cell: { flex: 1 },
  cellQty: { width: 40, textAlign: 'right' },
  cellPrice: { width: 80, textAlign: 'right' },
  cellTotal: { width: 80, textAlign: 'right' },
  totalSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', marginBottom: 4, width: 200, justifyContent: 'space-between' },
  grandTotal: { fontSize: 14, fontWeight: 'bold', marginTop: 8, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 8 }
});

interface QuotePDFProps {
  quote: Quote;
  settings?: any;
}

export const QuotePDF = ({ quote, settings }: QuotePDFProps) => {
  const client = quote.clientId as any;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
             <Text style={[styles.title, { marginBottom: 10 }]}>{settings?.companyName || 'FLUX ERP'}</Text>
             <Text style={{ color: '#666', lineHeight: 1.4 }}>{settings?.companyAddress || ''}</Text>
             <Text style={{ color: '#666' }}>{settings?.companyEmail || ''}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={[styles.title, { color: '#4F46E5' }]}>QUOTE</Text>
             <Text style={{ marginTop: 4, fontSize: 12 }}>#{quote.number}</Text>
             <Text style={{ marginTop: 4, color: '#666' }}>{quote.title}</Text>
          </View>
        </View>

        {/* INFO GRID */}
        <View style={{ flexDirection: 'row', marginBottom: 40 }}>
           <View style={{ flex: 1 }}>
              <Text style={styles.label}>Prepared For</Text>
              <Text style={styles.value}>{client?.name}</Text>
              <Text style={{ color: '#666' }}>{client?.email}</Text>
           </View>
           <View style={{ width: 150 }}>
              <Text style={styles.label}>Date Issued</Text>
              <Text style={styles.value}>{format(new Date(quote.date), 'MMM dd, yyyy')}</Text>
              
              <Text style={styles.label}>Valid Until</Text>
              <Text style={styles.value}>{format(new Date(quote.expiredDate), 'MMM dd, yyyy')}</Text>
           </View>
        </View>

        {/* TABLE HEADER */}
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.cell, { fontWeight: 'bold' }]}>Item</Text>
          <Text style={[styles.cellQty, { fontWeight: 'bold' }]}>Qty</Text>
          <Text style={[styles.cellPrice, { fontWeight: 'bold' }]}>Price</Text>
          <Text style={[styles.cellTotal, { fontWeight: 'bold' }]}>Total</Text>
        </View>

        {/* ITEMS */}
        {quote.items.map((item, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.cell}>
               <Text style={{ fontWeight: 'bold' }}>{item.itemName}</Text>
               <Text style={{ color: '#666', fontSize: 9 }}>{item.description}</Text>
            </View>
            <Text style={styles.cellQty}>{item.quantity}</Text>
            <Text style={styles.cellPrice}>${item.price.toFixed(2)}</Text>
            <Text style={styles.cellTotal}>${(item.quantity * item.price).toFixed(2)}</Text>
          </View>
        ))}

        {/* TOTALS */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
             <Text>Subtotal</Text>
             <Text>${quote.subTotal.toFixed(2)}</Text>
          </View>
          {quote.taxTotal > 0 && (
            <View style={styles.totalRow}>
               <Text>Tax ({quote.taxRate}%)</Text>
               <Text>+${quote.taxTotal.toFixed(2)}</Text>
            </View>
          )}
          {quote.discount > 0 && (
            <View style={styles.totalRow}>
               <Text>Discount</Text>
               <Text>-${quote.discount.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
             <Text>Estimated Total</Text>
             <Text>${quote.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={{ position: 'absolute', bottom: 40, left: 40, right: 40, borderTopWidth: 1, borderColor: '#EEE', paddingTop: 20 }}>
           <Text style={{ textAlign: 'center', color: '#999' }}>
              This quote is valid for 30 days. Contact us if you have any questions.
           </Text>
        </View>

      </Page>
    </Document>
  );
};