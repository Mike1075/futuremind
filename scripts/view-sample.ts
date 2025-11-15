import * as fs from 'fs'

const data = JSON.parse(fs.readFileSync('./scripts/sample-p001-documents.json', 'utf-8'))

console.log('📊 样本文档总数:', data.length)
console.log('\n🔑 文档字段:')
console.log(Object.keys(data[0]))

console.log('\n📄 第一个文档 (不含embedding向量):\n')

const firstDoc = { ...data[0] }
if (firstDoc.embedding) {
  firstDoc.embedding = `[向量数组，包含 ${firstDoc.embedding.length} 个数字]`
}

console.log(JSON.stringify(firstDoc, null, 2))

console.log('\n\n📝 内容预览:')
data.slice(0, 3).forEach((doc: any, index: number) => {
  console.log(`\n[${index + 1}] ${doc.id}`)
  console.log('Content:', doc.content?.substring(0, 200))
})
