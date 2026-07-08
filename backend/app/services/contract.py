"""Contract generation service: renders a professional contract HTML using Jinja2."""

from datetime import datetime

from jinja2 import Template

# ---------------------------------------------------------------------------
# Professional contract HTML template (inline Jinja2)
# ---------------------------------------------------------------------------

CONTRACT_TEMPLATE = Template(
    """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>厂房租赁合同 - {{ contract_no }}</title>
<style>
  @page { size: A4; margin: 2cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "SimSun", "宋体", "Noto Serif CJK SC", serif;
    font-size: 14px;
    line-height: 2;
    color: #1a1a1a;
    max-width: 210mm;
    margin: 0 auto;
    padding: 20px 40px;
    background: #fff;
  }
  .header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #1a3c6e;
  }
  .header h1 {
    font-size: 24px;
    color: #1a3c6e;
    letter-spacing: 4px;
    margin-bottom: 8px;
  }
  .header .contract-no {
    font-size: 13px;
    color: #666;
  }
  .party-info {
    margin-bottom: 24px;
  }
  .party-info h3 {
    font-size: 15px;
    color: #1a3c6e;
    margin-bottom: 8px;
    border-left: 3px solid #1a3c6e;
    padding-left: 10px;
  }
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .info-table td {
    padding: 6px 10px;
    border: 1px solid #ddd;
    vertical-align: top;
  }
  .info-table td.label {
    background: #f5f7fa;
    font-weight: bold;
    width: 18%;
    color: #1a3c6e;
  }
  .info-table td.value {
    width: 32%;
  }
  .section {
    margin-bottom: 20px;
  }
  .section h3 {
    font-size: 15px;
    color: #1a3c6e;
    margin-bottom: 10px;
    border-left: 3px solid #1a3c6e;
    padding-left: 10px;
  }
  .terms-content {
    white-space: pre-wrap;
    line-height: 2;
    padding: 10px;
    border: 1px solid #eee;
    background: #fafafa;
    min-height: 200px;
  }
  .signature-area {
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
  }
  .signature-block {
    width: 42%;
  }
  .signature-block h4 {
    font-size: 14px;
    margin-bottom: 12px;
    color: #1a3c6e;
  }
  .signature-block p {
    margin-bottom: 6px;
    font-size: 13px;
  }
  .signature-line {
    margin-top: 50px;
    border-top: 1px solid #333;
    padding-top: 6px;
    font-size: 12px;
    color: #999;
    text-align: center;
  }
  .footer-note {
    margin-top: 40px;
    padding-top: 15px;
    border-top: 1px solid #ddd;
    text-align: center;
    font-size: 12px;
    color: #999;
  }
  .seal {
    display: inline-block;
    width: 80px;
    height: 80px;
    border: 2px dashed #c00;
    border-radius: 50%;
    text-align: center;
    line-height: 80px;
    color: #c00;
    font-size: 13px;
    margin-top: 10px;
  }
  @media print {
    body { padding: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

<div class="header">
  <h1>广澜印刷包装有限公司</h1>
  <h1>厂房租赁合同</h1>
  <p class="contract-no">合同编号：{{ contract_no }}</p>
</div>

<!-- 甲乙方信息 -->
<div class="party-info">
  <h3>合同双方信息</h3>
  <table class="info-table">
    <tr>
      <td class="label">甲方（出租方）</td>
      <td class="value">{{ party_a }}</td>
      <td class="label">乙方（承租方）</td>
      <td class="value">{{ party_b }}</td>
    </tr>
    <tr>
      <td class="label">签订日期</td>
      <td class="value">{{ sign_date }}</td>
      <td class="label">合同编号</td>
      <td class="value">{{ contract_no }}</td>
    </tr>
  </table>
</div>

<!-- 租赁标的 -->
<div class="section">
  <h3>一、租赁标的信息</h3>
  <table class="info-table">
    <tr>
      <td class="label">厂房名称</td>
      <td class="value">{{ space_name }}</td>
      <td class="label">租赁类型</td>
      <td class="value">{{ rent_type_label }}</td>
    </tr>
    <tr>
      <td class="label">租金单价</td>
      <td class="value">&yen; {{ "%.2f"|format(rent_amount) }} / {{ rent_unit }}</td>
      <td class="label">租赁期限</td>
      <td class="value">{{ start_date }} 至 {{ end_date }}</td>
    </tr>
    {% if deposit %}
    <tr>
      <td class="label">押金</td>
      <td class="value" colspan="3">{{ deposit }}</td>
    </tr>
    {% endif %}
  </table>
</div>

<!-- 合同条款 -->
<div class="section">
  <h3>二、合同条款</h3>
  <div class="terms-content">
{% if terms %}
{{ terms }}
{% else %}
1. 租赁期限：本合同租赁期限自 {{ start_date }} 起至 {{ end_date }} 止。

2. 租金及支付方式：租金按{{ rent_type_label }}支付，每{{ rent_unit }}租金为人民币 {{ "%.2f"|format(rent_amount) }} 元。乙方应于每期开始前5个工作日内支付当期租金。

3. 押金：{% if deposit %}{{ deposit }}{% else %}双方另行协商确定。{% endif %}

4. 厂房用途：乙方租赁厂房用于合法生产经营活动，不得擅自改变厂房用途。

5. 维护责任：甲方负责厂房主体结构的维护，乙方负责日常使用中的设备设施维护。

6. 违约责任：任何一方违反本合同约定，应承担相应的违约责任，赔偿对方因此遭受的直接经济损失。

7. 合同变更与解除：经双方协商一致，可以变更或解除本合同。变更或解除合同应采用书面形式。

8. 争议解决：本合同履行过程中发生的争议，由双方协商解决；协商不成的，可向甲方所在地人民法院提起诉讼。

9. 其他约定：本合同一式两份，甲乙双方各执一份，具有同等法律效力。
{% endif %}
  </div>
</div>

<!-- 签章区域 -->
<div class="signature-area">
  <div class="signature-block">
    <h4>甲方（出租方）</h4>
    <p>单位名称：广澜印刷包装有限公司</p>
    <p>法定代表人/授权代表：_______________</p>
    <p>联系电话：_______________</p>
    <p>日期：____年____月____日</p>
    <div class="signature-line">（盖章处）</div>
  </div>
  <div class="signature-block">
    <h4>乙方（承租方）</h4>
    <p>单位名称：{{ party_b }}</p>
    <p>法定代表人/授权代表：_______________</p>
    <p>联系电话：_______________</p>
    <p>日期：____年____月____日</p>
    <div class="signature-line">（盖章处）</div>
  </div>
</div>

<div class="footer-note">
  <p>本合同由广澜租赁平台生成，经双方签字盖章后生效。</p>
  <p>生成时间：{{ generate_time }}</p>
</div>

</body>
</html>"""
)


def generate_contract_html(
    contract_no: str,
    party_a: str,
    party_b: str,
    space_name: str,
    rent_type: str,
    rent_amount: float,
    start_date: str,
    end_date: str,
    deposit: str | None = None,
    terms: str | None = None,
) -> str:
    """Render a professional contract HTML page using the Jinja2 template.

    Args:
        contract_no: Unique contract number (e.g. HT-20260708-001).
        party_a: Party A name (广澜印刷包装有限公司).
        party_b: Party B name (customer).
        space_name: Factory space name.
        rent_type: "monthly" or "yearly".
        rent_amount: Rent amount per unit period.
        start_date: Lease start date string.
        end_date: Lease end date string.
        deposit: Optional deposit description.
        terms: Optional custom terms text.

    Returns:
        Complete HTML string of the contract.
    """
    rent_type_label = "月租" if rent_type == "monthly" else "年租"
    rent_unit = "月" if rent_type == "monthly" else "年"

    return CONTRACT_TEMPLATE.render(
        contract_no=contract_no,
        party_a=party_a,
        party_b=party_b,
        space_name=space_name,
        rent_type=rent_type,
        rent_type_label=rent_type_label,
        rent_unit=rent_unit,
        rent_amount=rent_amount,
        start_date=start_date,
        end_date=end_date,
        deposit=deposit or "",
        terms=terms or "",
        sign_date=datetime.utcnow().strftime("%Y年%m月%d日"),
        generate_time=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    )
