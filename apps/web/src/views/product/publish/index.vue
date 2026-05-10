<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  Textarea,
  Button,
  Space,
  Select,
  SelectOption,
  Divider,
  Row,
  Col,
  Upload,
  message,
  Steps,
  Step,
  Result,
  TreeSelect,
  Spin,
} from 'ant-design-vue';
import {
  PlusOutlined,
  SendOutlined,
  InboxOutlined,
} from '@ant-design/icons-vue';
import { useStoreAccountStore } from '@/store';
import {
  publishProductApi,
  getCategoryAttributesApi,
  type CategoryAttribute,
  type PublishProductParams,
} from '@/api/product-publish';
import { getFullCategoryTreeApi, type Category } from '@/api/category';

const storeAccountStore = useStoreAccountStore();
const storeAccountId = computed(() => storeAccountStore.activeStoreId || '');

/* ---- steps ---- */
const currentStep = ref(0);

/* ---- category ---- */
const categoryTree = ref<any[]>([]);
const categoryLoading = ref(false);
const selectedCategoryId = ref<number | undefined>(undefined);
const categoryAttributes = ref<CategoryAttribute[]>([]);
const attrLoading = ref(false);

/* ---- form ---- */
const formRef = ref();
const formData = ref<Partial<PublishProductParams>>({
  name: '',
  offerId: '',
  description: '',
  price: 0,
  oldPrice: 0,
  currencyCode: 'RUB',
  weightGross: 0,
  dimensionLength: 0,
  dimensionWidth: 0,
  dimensionHeight: 0,
  images: [],
  primaryImage: '',
});

/* ---- publish result ---- */
const publishing = ref(false);
const publishResult = ref<{ taskId?: number; message?: string; error?: string } | null>(null);

/* ---- transform category tree for TreeSelect ---- */
function transformTree(nodes: Category[]): any[] {
  return nodes.map((n) => ({
    value: n.id,
    title: n.nameZh ? `${n.nameZh} (${n.name})` : n.name,
    children: n.children && n.children.length > 0 ? transformTree(n.children) : undefined,
    selectable: !n.hasChildren, // only leaf categories are selectable
  }));
}

async function loadCategories() {
  categoryLoading.value = true;
  try {
    const tree = await getFullCategoryTreeApi();
    categoryTree.value = transformTree(tree);
  } catch {
    categoryTree.value = [];
  } finally {
    categoryLoading.value = false;
  }
}

async function loadCategoryAttributes(categoryId: number) {
  if (!storeAccountId.value) return;
  attrLoading.value = true;
  try {
    categoryAttributes.value = await getCategoryAttributesApi(
      storeAccountId.value,
      categoryId,
    );
  } catch {
    categoryAttributes.value = [];
  } finally {
    attrLoading.value = false;
  }
}

watch(selectedCategoryId, (val) => {
  if (val !== undefined) {
    loadCategoryAttributes(val);
  }
});

/* ---- actions ---- */
function handleNextStep() {
  if (currentStep.value === 0) {
    if (!selectedCategoryId.value) {
      message.warning('请先选择商品分类');
      return;
    }
    currentStep.value = 1;
  }
}

function handlePrevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
    publishResult.value = null;
  }
}

async function handlePublish() {
  if (!storeAccountId.value) {
    message.warning('请先选择店铺');
    return;
  }

  publishing.value = true;
  try {
    const params: PublishProductParams = {
      storeAccountId: storeAccountId.value,
      name: formData.value.name || '',
      offerId: formData.value.offerId || '',
      descriptionCategoryId: selectedCategoryId.value!,
      description: formData.value.description,
      price: formData.value.price || 0,
      oldPrice: formData.value.oldPrice,
      currencyCode: formData.value.currencyCode || 'RUB',
      weightGross: formData.value.weightGross,
      dimensionLength: formData.value.dimensionLength,
      dimensionWidth: formData.value.dimensionWidth,
      dimensionHeight: formData.value.dimensionHeight,
      images: formData.value.images,
      primaryImage: formData.value.primaryImage,
    };

    const res = await publishProductApi(params);
    publishResult.value = res;
    currentStep.value = 2;
    message.success('产品刊登任务已提交');
  } catch (err: any) {
    publishResult.value = { error: err.message || '刊登失败' };
  } finally {
    publishing.value = false;
  }
}

function handleReset() {
  currentStep.value = 0;
  selectedCategoryId.value = undefined;
  formData.value = {
    name: '',
    offerId: '',
    description: '',
    price: 0,
    oldPrice: 0,
    currencyCode: 'RUB',
    weightGross: 0,
    dimensionLength: 0,
    dimensionWidth: 0,
    dimensionHeight: 0,
    images: [],
    primaryImage: '',
  };
  publishResult.value = null;
  categoryAttributes.value = [];
}

/* ---- init ---- */
loadCategories();
</script>

<template>
  <div>
    <h2 style="margin-bottom: 24px">OZON产品刊登</h2>

    <Card>
      <Steps :current="currentStep" style="margin-bottom: 32px">
        <Step title="选择分类" description="选择商品所属的Ozon分类" />
        <Step title="填写信息" description="填写商品详细信息" />
        <Step title="提交结果" description="查看提交状态" />
      </Steps>

      <!-- Step 1: Category Selection -->
      <div v-if="currentStep === 0">
        <div style="max-width: 600px; margin: 0 auto">
          <h3 style="margin-bottom: 16px">选择商品分类</h3>
          <p style="color: #888; margin-bottom: 16px">
            请选择商品所属的 Ozon 分类。只能选择最末级分类。
          </p>

          <Spin :spinning="categoryLoading">
            <TreeSelect
              v-model:value="selectedCategoryId"
              :treeData="categoryTree"
              placeholder="搜索或选择分类..."
              style="width: 100%"
              showSearch
              treeDefaultExpandAll
              :filterTreeNode="(input: string, node: any) =>
                node.title?.toLowerCase().includes(input.toLowerCase())
              "
              size="large"
              allowClear
            />
          </Spin>

          <!-- Show required attributes preview -->
          <div v-if="categoryAttributes.length > 0" style="margin-top: 24px">
            <h4>此分类必填属性 ({{ categoryAttributes.filter(a => a.is_required).length }} 项)</h4>
            <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px">
              <span
                v-for="attr in categoryAttributes.filter(a => a.is_required).slice(0, 20)"
                :key="attr.id"
                style="
                  display: inline-block;
                  padding: 2px 8px;
                  background: #e6f7ff;
                  border: 1px solid #91d5ff;
                  border-radius: 4px;
                  font-size: 12px;
                  color: #1890ff;
                "
              >
                {{ attr.name }}
              </span>
            </div>
          </div>

          <div style="margin-top: 32px; text-align: center">
            <Button type="primary" size="large" @click="handleNextStep" :disabled="!selectedCategoryId">
              下一步
            </Button>
          </div>
        </div>
      </div>

      <!-- Step 2: Product Info Form -->
      <div v-if="currentStep === 1">
        <Form
          ref="formRef"
          :model="formData"
          layout="vertical"
          style="max-width: 800px; margin: 0 auto"
        >
          <Divider>基本信息</Divider>
          <Row :gutter="16">
            <Col :span="16">
              <FormItem label="商品名称" required>
                <Input v-model:value="formData.name" placeholder="输入商品名称（俄语/英语）" />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="商家SKU (Offer ID)" required>
                <Input v-model:value="formData.offerId" placeholder="如 MY-SKU-001" />
              </FormItem>
            </Col>
          </Row>

          <FormItem label="商品描述">
            <Textarea
              v-model:value="formData.description"
              :rows="4"
              placeholder="商品详细描述..."
            />
          </FormItem>

          <Divider>价格</Divider>
          <Row :gutter="16">
            <Col :span="8">
              <FormItem label="售价" required>
                <InputNumber
                  v-model:value="formData.price"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  prefix="₽"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="原价 (划线价)">
                <InputNumber
                  v-model:value="formData.oldPrice"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  prefix="₽"
                />
              </FormItem>
            </Col>
            <Col :span="8">
              <FormItem label="货币">
                <Select v-model:value="formData.currencyCode">
                  <SelectOption value="RUB">RUB (卢布)</SelectOption>
                  <SelectOption value="USD">USD (美元)</SelectOption>
                  <SelectOption value="EUR">EUR (欧元)</SelectOption>
                  <SelectOption value="CNY">CNY (人民币)</SelectOption>
                </Select>
              </FormItem>
            </Col>
          </Row>

          <Divider>物流信息</Divider>
          <Row :gutter="16">
            <Col :span="6">
              <FormItem label="毛重 (克)">
                <InputNumber
                  v-model:value="formData.weightGross"
                  :min="0"
                  style="width: 100%"
                />
              </FormItem>
            </Col>
            <Col :span="6">
              <FormItem label="长 (mm)">
                <InputNumber
                  v-model:value="formData.dimensionLength"
                  :min="0"
                  style="width: 100%"
                />
              </FormItem>
            </Col>
            <Col :span="6">
              <FormItem label="宽 (mm)">
                <InputNumber
                  v-model:value="formData.dimensionWidth"
                  :min="0"
                  style="width: 100%"
                />
              </FormItem>
            </Col>
            <Col :span="6">
              <FormItem label="高 (mm)">
                <InputNumber
                  v-model:value="formData.dimensionHeight"
                  :min="0"
                  style="width: 100%"
                />
              </FormItem>
            </Col>
          </Row>

          <Divider>图片</Divider>
          <FormItem label="主图 URL">
            <Input v-model:value="formData.primaryImage" placeholder="https://..." />
          </FormItem>

          <div style="margin-top: 32px; display: flex; justify-content: space-between">
            <Button @click="handlePrevStep">上一步</Button>
            <Button type="primary" size="large" :loading="publishing" @click="handlePublish">
              <template #icon><SendOutlined /></template>
              提交刊登
            </Button>
          </div>
        </Form>
      </div>

      <!-- Step 3: Result -->
      <div v-if="currentStep === 2">
        <Result
          v-if="publishResult && !publishResult.error"
          status="success"
          title="刊登任务已提交"
          :sub-title="`任务ID: ${publishResult.taskId || '-'}. ${publishResult.message || ''}`"
        >
          <template #extra>
            <Space>
              <Button type="primary" @click="handleReset">继续刊登</Button>
              <Button @click="$router.push({ name: 'ProductOnline' })">返回产品列表</Button>
            </Space>
          </template>
        </Result>
        <Result
          v-else-if="publishResult?.error"
          status="error"
          title="刊登失败"
          :sub-title="publishResult.error"
        >
          <template #extra>
            <Button type="primary" @click="handlePrevStep">返回修改</Button>
          </template>
        </Result>
      </div>
    </Card>
  </div>
</template>
