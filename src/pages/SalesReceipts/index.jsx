import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import TableContainer from "../../components/Common/TableContainer";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  FormFeedback,
  Input,
  Form,
  Button,
  Table,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const SalesReceipts = () => {
  document.title = "Sales Receipts";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [activeTab, setActiveTab] = useState("1"); // "1" for list, "2" for create
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [receiptItems, setReceiptItems] = useState([]);
  const [splitsPreview, setSplitsPreview] = useState([]);
  const [showSplitsModal, setShowSplitsModal] = useState(false);
  const [nextReceiptNo, setNextReceiptNo] = useState(1);
  const [userId, setUserId] = useState(1); // TODO: Get from auth context

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      receipt_no: nextReceiptNo,
      receipt_date: moment().format("YYYY-MM-DD"),
      unit_id: "",
      people_id: "",
      account_id: "",
      amount: 0,
      description: "",
      status: 1,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      receipt_no: Yup.number().required("Receipt number is required").min(1),
      receipt_date: Yup.date().required("Receipt date is required"),
      unit_id: Yup.number().required("Unit is required").min(1, "Please select a unit"),
      people_id: Yup.number().required("People/Customer is required").min(1, "Please select a people/customer"),
      account_id: Yup.number().required("Asset Account is required").min(1, "Please select an asset account"),
      amount: Yup.number().required("Amount is required"),
      description: Yup.string().required("Description is required"),
      status: Yup.number().oneOf([0, 1]),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          receipt_no: parseInt(values.receipt_no),
          receipt_date: values.receipt_date,
          unit_id: values.unit_id ? parseInt(values.unit_id) : null,
          people_id: values.people_id ? parseInt(values.people_id) : null,
          account_id: values.account_id ? parseInt(values.account_id) : null,
          amount: parseFloat(values.amount),
          description: values.description,
          status: parseInt(values.status),
          building_id: parseInt(values.building_id),
          items: receiptItems.map((item) => ({
            item_id: parseInt(item.item_id),
            qty: item.qty,
            rate: item.rate ? item.rate.toString() : null,
            previous_value: item.previous_value !== null && item.previous_value !== undefined ? item.previous_value : null,
            current_value: item.current_value !== null && item.current_value !== undefined ? item.current_value : null,
          })),
        };

        let url = "sales-receipts";
        if (buildingId) {
          url = `buildings/${buildingId}/sales-receipts`;
        }

        // Add user_id to headers
        const config = {
          headers: {
            "User-ID": userId.toString(),
          },
        };

        const { data } = await axiosInstance.post(url, payload, config);
        toast.success("Sales receipt created successfully");
        validation.resetForm();
        setReceiptItems([]);
        setSplitsPreview(null);
        fetchNextReceiptNo();
        // Switch to list tab and refresh receipts
        setActiveTab("1");
        fetchReceipts();
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchItems = async () => {
    try {
      let url = "items";
      if (buildingId) {
        url = `buildings/${buildingId}/items`;
      }
      const { data } = await axiosInstance.get(url);
      setItems(data || []);
    } catch (error) {
      console.log("Error fetching items", error);
    }
  };

  const fetchUnits = async () => {
    try {
      let url = "units";
      if (buildingId) {
        url = `buildings/${buildingId}/units`;
      }
      const { data } = await axiosInstance.get(url);
      setUnits(data || []);
    } catch (error) {
      console.log("Error fetching units", error);
    }
  };

  const fetchPeople = async () => {
    try {
      let url = "people";
      if (buildingId) {
        url = `buildings/${buildingId}/people`;
      }
      const { data } = await axiosInstance.get(url);
      setPeople(data || []);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data || []);
      
      // Filter accounts for Asset accounts
      const assetAccountsList = (data || []).filter((account) => {
        const typeName = account.account_type?.typeName || "";
        return typeName.toLowerCase().includes("asset") || 
               typeName.toLowerCase().includes("cash") ||
               typeName.toLowerCase().includes("bank");
      });
      setAssetAccounts(assetAccountsList);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchNextReceiptNo = async () => {
    // This would typically come from the backend
    // For now, we'll use a simple increment
    setNextReceiptNo((prev) => prev + 1);
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      let url = "sales-receipts";
      if (buildingId) {
        url = `buildings/${buildingId}/sales-receipts`;
      } else {
        url = `sales-receipts?building_id=${buildingId || ""}`;
      }
      const { data } = await axiosInstance.get(url);
      setReceipts(data || []);
    } catch (error) {
      console.log("Error fetching sales receipts", error);
      toast.error("Failed to fetch sales receipts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchUnits();
    fetchPeople();
    fetchAccounts();
    fetchNextReceiptNo();
    if (activeTab === "1") {
      fetchReceipts();
    }
  }, [buildingId, activeTab]);

  const addReceiptItem = () => {
    setReceiptItems([
      ...receiptItems,
      {
        item_id: "",
        qty: 1,
        rate: "",
        previous_value: null,
        current_value: null,
        item_name: "",
        total: 0,
      },
    ]);
  };

  const removeReceiptItem = (index) => {
    const newItems = receiptItems.filter((_, i) => i !== index);
    setReceiptItems(newItems);
    calculateTotal(newItems);
    calculateSplits(newItems);
  };

  const updateReceiptItem = (index, field, value) => {
    const newItems = [...receiptItems];
    newItems[index][field] = value;

    // If item_id changed, update item_name and set current_value
    if (field === "item_id") {
      const item = items.find((i) => i.id === parseInt(value));
      if (item) {
        newItems[index].item_name = item.name;
        newItems[index].rate = item.avg_cost.toString();
        // Set current_value to item's avg_cost if not already set
        if (newItems[index].current_value === null || newItems[index].current_value === undefined) {
          newItems[index].current_value = item.avg_cost;
        }
        // For discount/payment items, set qty to 1 and make rate negative
        if (item.type === "discount" || item.type === "payment") {
          newItems[index].qty = 1;
          const rateValue = parseFloat(item.avg_cost);
          newItems[index].rate = rateValue < 0 ? rateValue.toString() : (-Math.abs(rateValue)).toString();
        }
      }
    }

    // For discount/payment items, force rate to negative on blur
    if (field === "rate") {
      const item = items.find((i) => i.id === parseInt(newItems[index].item_id));
      if (item && (item.type === "discount" || item.type === "payment")) {
        const rateValue = parseFloat(value) || 0;
        // Force to negative
        newItems[index].rate = (-Math.abs(rateValue)).toString();
      }
    }

    // Calculate total for this item
    if (field === "qty" || field === "rate" || field === "item_id") {
      const item = items.find((i) => i.id === parseInt(newItems[index].item_id));
      if (item) {
        if (item.type === "discount" || item.type === "payment") {
          // For discount/payment, use rate directly (qty is always 1)
          const rateValue = parseFloat(newItems[index].rate) || 0;
          newItems[index].total = Math.abs(rateValue); // Store as positive for calculation
          newItems[index].qty = 1; // Force qty to 1
        } else {
          // For other items, use qty * rate
          if (newItems[index].item_id && newItems[index].qty && newItems[index].rate) {
            newItems[index].total = parseFloat(newItems[index].qty) * parseFloat(newItems[index].rate);
          } else {
            newItems[index].total = 0;
          }
        }
      } else {
        newItems[index].total = 0;
      }
    }

    setReceiptItems(newItems);
    calculateTotal(newItems);
    calculateSplits(newItems);
  };

  const calculateSplits = (itemsList) => {
    if (itemsList.length === 0 || accounts.length === 0 || !validation.values.account_id) {
      setSplitsPreview({ splits: [], total_debit: 0, total_credit: 0, is_balanced: true });
      return;
    }

    const splits = [];

    // Get selected Asset account
    const assetAccountId = validation.values.account_id;
    if (!assetAccountId) {
      setSplitsPreview({ splits: [], total_debit: 0, total_credit: 0, is_balanced: true });
      return;
    }
    
    const assetAccount = accounts.find((a) => a.id === parseInt(assetAccountId));
    if (!assetAccount) {
      setSplitsPreview({ splits: [], total_debit: 0, total_credit: 0, is_balanced: true });
      return;
    }

    // Calculate totals by item type
    const serviceIncomeByAccount = {}; // For positive amounts (credits)
    const serviceDebitByAccount = {}; // For negative amounts (debits)
    let discountIncomeAccount = null;
    let paymentAssetAccount = null;
    let serviceTotalAmount = 0;

    itemsList.forEach((receiptItem) => {
      if (!receiptItem.item_id) return;

      const item = items.find((i) => i.id === parseInt(receiptItem.item_id));
      if (!item) return;

      const itemTotal = receiptItem.total || 0;

      if (item.type === "discount") {
        // Use absolute value for discount (even if rate is negative, use positive in splits)
        const discountAmount = Math.abs(itemTotal);
        // Get discount income account
        if (item.income_account?.id) {
          discountIncomeAccount = item.income_account;
        }
      } else if (item.type === "payment") {
        // Use absolute value for payment (even if rate is negative, use positive in splits)
        const paymentAmount = Math.abs(itemTotal);
        // Get payment asset account
        if (item.asset_account?.id) {
          paymentAssetAccount = item.asset_account;
        }
      } else if (item.type === "service") {
        // Add service items to service total
        serviceTotalAmount += itemTotal;
        // Group service income by account - handle negative rates as debits
        if (item.income_account?.id) {
          if (itemTotal >= 0) {
            // Positive rate: credit income account
            if (!serviceIncomeByAccount[item.income_account.id]) {
              serviceIncomeByAccount[item.income_account.id] = 0;
            }
            serviceIncomeByAccount[item.income_account.id] += itemTotal;
          } else {
            // Negative rate: debit income account
            if (!serviceDebitByAccount[item.income_account.id]) {
              serviceDebitByAccount[item.income_account.id] = 0;
            }
            serviceDebitByAccount[item.income_account.id] += Math.abs(itemTotal);
          }
        }
      }
    });

    // Calculate discount and payment totals
    let discountTotal = 0;
    let paymentTotal = 0;
    itemsList.forEach((receiptItem) => {
      if (!receiptItem.item_id) return;
      const item = items.find((i) => i.id === parseInt(receiptItem.item_id));
      if (!item) return;
      if (item.type === "discount") {
        discountTotal += Math.abs(receiptItem.total || 0);
      } else if (item.type === "payment") {
        paymentTotal += Math.abs(receiptItem.total || 0);
      }
    });

    // Get selected people name
    const selectedPeopleId = validation.values.people_id ? parseInt(validation.values.people_id) : null;
    const selectedPeople = selectedPeopleId ? people.find((p) => p.id === selectedPeopleId) : null;
    const peopleName = selectedPeople ? selectedPeople.name : null;

    // Calculate Asset Account amount = service total - discount - payment
    const assetAmount = serviceTotalAmount - discountTotal - paymentTotal;

    // Debit or Credit: Asset Account (depending on net amount)
    if (assetAmount > 0) {
      // Net positive: debit asset account
      splits.push({
        account_id: assetAccount.id,
        account_name: assetAccount.account_name,
        people_id: selectedPeopleId,
        people_name: peopleName,
        debit: assetAmount,
        credit: null,
        status: "active",
      });
    } else if (assetAmount < 0) {
      // Net negative: credit asset account (refund/reversal)
      splits.push({
        account_id: assetAccount.id,
        account_name: assetAccount.account_name,
        people_id: selectedPeopleId,
        people_name: peopleName,
        debit: null,
        credit: Math.abs(assetAmount),
        status: "active",
      });
    }

    // Debit: Discount Income Account (if discount items exist)
    if (discountTotal > 0 && discountIncomeAccount) {
      splits.push({
        account_id: discountIncomeAccount.id,
        account_name: discountIncomeAccount.account_name || "Discount Income",
        people_id: selectedPeopleId,
        people_name: peopleName,
        debit: discountTotal,
        credit: null,
        status: "active",
      });
    }

    // Debit: Payment Asset Account (if payment items exist)
    if (paymentTotal > 0 && paymentAssetAccount) {
      splits.push({
        account_id: paymentAssetAccount.id,
        account_name: paymentAssetAccount.account_name || "Payment Asset",
        people_id: selectedPeopleId,
        people_name: peopleName,
        debit: paymentTotal,
        credit: null,
        status: "active",
      });
    }

    // Credit: Service Income Accounts (positive rates)
    Object.keys(serviceIncomeByAccount).forEach((accountId) => {
      const account = accounts.find((a) => a.id === parseInt(accountId));
      if (account) {
        splits.push({
          account_id: parseInt(accountId),
          account_name: account.account_name,
          people_id: selectedPeopleId,
          people_name: peopleName,
          debit: null,
          credit: serviceIncomeByAccount[accountId],
          status: "active",
        });
      }
    });

    // Debit: Service Income Accounts (negative rates - refunds/reversals)
    Object.keys(serviceDebitByAccount).forEach((accountId) => {
      const account = accounts.find((a) => a.id === parseInt(accountId));
      if (account) {
        splits.push({
          account_id: parseInt(accountId),
          account_name: account.account_name,
          people_id: selectedPeopleId,
          people_name: peopleName,
          debit: serviceDebitByAccount[accountId],
          credit: null,
          status: "active",
        });
      }
    });

    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;
    splits.forEach((split) => {
      if (split.debit) totalDebit += split.debit;
      if (split.credit) totalCredit += split.credit;
    });

    // Balance if needed (adjust service income if there's a difference)
    if (totalDebit !== totalCredit && splits.length > 0) {
      const firstServiceIncomeSplit = splits.find((s) => s.credit && !s.debit);
      if (firstServiceIncomeSplit) {
        const diff = totalDebit - totalCredit;
        firstServiceIncomeSplit.credit += diff;
        totalCredit += diff;
      }
    }

    setSplitsPreview({
      splits,
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: totalDebit === totalCredit,
    });
  };

  const calculateTotal = (receiptItemsList) => {
    let total = 0;
    receiptItemsList.forEach((receiptItem) => {
      if (!receiptItem.item_id) {
        total += receiptItem.total || 0;
        return;
      }
      const item = items.find((i) => i.id === parseInt(receiptItem.item_id));
      if (!item) {
        total += receiptItem.total || 0;
        return;
      }
      
      if (item.type === "discount" || item.type === "payment") {
        // Subtract discount and payment amounts (they're stored as positive but should reduce total)
        total -= Math.abs(receiptItem.total || 0);
      } else {
        // Add other items
        total += receiptItem.total || 0;
      }
    });
    validation.setFieldValue("amount", Math.max(0, total).toFixed(2));
    calculateSplits(receiptItemsList);
  };

  const previewSplits = () => {
    if (receiptItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    // Splits are already calculated client-side, just show the modal
    setShowSplitsModal(true);
  };

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        header: "Receipt #",
        accessorKey: "receipt_no",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Receipt Date",
        accessorKey: "receipt_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.receipt_date ? moment(cell.row.original.receipt_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Customer",
        accessorKey: "people_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const person = people.find((p) => p.id === cell.row.original.people_id);
          return <>{person ? person.name : `ID: ${cell.row.original.people_id || "N/A"}`}</>;
        },
      },
      {
        header: "Unit",
        accessorKey: "unit_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const unit = units.find((u) => u.id === cell.row.original.unit_id);
          return <>{unit ? unit.unit_number || unit.name : `ID: ${cell.row.original.unit_id || "N/A"}`}</>;
        },
      },
      {
        header: "Amount",
        accessorKey: "amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.description || "N/A"}</>;
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const status = cell.row.original.status;
          return (
            <span className={`badge ${status === 1 ? "bg-success" : "bg-secondary"}`}>
              {status === 1 ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        header: "Created",
        accessorKey: "created_at",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.created_at ? moment(cell.row.original.created_at).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
    ],
    [people, units]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Sales Receipts" breadcrumbItem="Sales Receipts" />
          <Nav tabs className="nav-tabs-custom">
            <NavItem>
              <NavLink
                className={activeTab === "1" ? "active" : ""}
                onClick={() => {
                  setActiveTab("1");
                  fetchReceipts();
                }}
                style={{ cursor: "pointer" }}
              >
                <i className="bx bx-list-ul me-1"></i> Receipt List
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === "2" ? "active" : ""}
                onClick={() => setActiveTab("2")}
                style={{ cursor: "pointer" }}
              >
                <i className="bx bx-plus-circle me-1"></i> Create Receipt
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={activeTab} className="p-3">
            <TabPane tabId="1">
              {isLoading ? (
                <Spinners setLoading={setLoading} />
              ) : (
                <Row>
                  <Col lg="12">
                    <Card>
                      <CardBody>
                        <TableContainer
                          columns={columns}
                          data={receipts || []}
                          isGlobalFilter={true}
                          isPagination={false}
                          SearchPlaceholder="Search..."
                          isCustomPageSize={true}
                          tableClass="align-middle table-nowrap table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                          theadClass="table-light"
                          paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                          pagination="pagination"
                        />
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              )}
            </TabPane>
            <TabPane tabId="2">
              {isLoading ? (
                <Spinners setLoading={setLoading} />
              ) : (
                <Row>
                  <Col lg="12">
                    <Card>
                      <CardBody>
                    <Form
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}
                    >
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Receipt Number</Label>
                            <Input
                              name="receipt_no"
                              type="number"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.receipt_no || ""}
                              invalid={validation.touched.receipt_no && validation.errors.receipt_no ? true : false}
                            />
                            {validation.touched.receipt_no && validation.errors.receipt_no ? (
                              <FormFeedback type="invalid">{validation.errors.receipt_no}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Receipt Date</Label>
                            <Input
                              name="receipt_date"
                              type="date"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.receipt_date || ""}
                              invalid={validation.touched.receipt_date && validation.errors.receipt_date ? true : false}
                            />
                            {validation.touched.receipt_date && validation.errors.receipt_date ? (
                              <FormFeedback type="invalid">{validation.errors.receipt_date}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Unit <span className="text-danger">*</span></Label>
                            <Input
                              name="unit_id"
                              type="select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.unit_id || ""}
                              invalid={validation.touched.unit_id && validation.errors.unit_id ? true : false}
                            >
                              <option value="">Select Unit</option>
                              {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                  {unit.name}
                                </option>
                              ))}
                            </Input>
                            {validation.touched.unit_id && validation.errors.unit_id ? (
                              <FormFeedback type="invalid">{validation.errors.unit_id}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>People/Customer <span className="text-danger">*</span></Label>
                            <Input
                              name="people_id"
                              type="select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.people_id || ""}
                              invalid={validation.touched.people_id && validation.errors.people_id ? true : false}
                            >
                              <option value="">Select People</option>
                              {people.map((person) => (
                                <option key={person.id} value={person.id}>
                                  {person.name}
                                </option>
                              ))}
                            </Input>
                            {validation.touched.people_id && validation.errors.people_id ? (
                              <FormFeedback type="invalid">{validation.errors.people_id}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Asset Account <span className="text-danger">*</span></Label>
                            <Input
                              name="account_id"
                              type="select"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.account_id || ""}
                              invalid={validation.touched.account_id && validation.errors.account_id ? true : false}
                            >
                              <option value="">Select Asset Account</option>
                              {assetAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.account_name} ({account.account_number})
                                </option>
                              ))}
                            </Input>
                            {validation.touched.account_id && validation.errors.account_id ? (
                              <FormFeedback type="invalid">{validation.errors.account_id}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col md={6}>
                          <div className="mb-3">
                            <Label>Amount</Label>
                            <Input
                              name="amount"
                              type="number"
                              step="0.01"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.amount || 0}
                              invalid={validation.touched.amount && validation.errors.amount ? true : false}
                              readOnly
                            />
                            {validation.touched.amount && validation.errors.amount ? (
                              <FormFeedback type="invalid">{validation.errors.amount}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                        <Col md={12}>
                          <div className="mb-3">
                            <Label>Description</Label>
                            <Input
                              name="description"
                              type="textarea"
                              rows="3"
                              onChange={validation.handleChange}
                              onBlur={validation.handleBlur}
                              value={validation.values.description || ""}
                              invalid={validation.touched.description && validation.errors.description ? true : false}
                            />
                            {validation.touched.description && validation.errors.description ? (
                              <FormFeedback type="invalid">{validation.errors.description}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={12}>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <Label>Receipt Items</Label>
                              <Button type="button" color="primary" size="sm" onClick={addReceiptItem}>
                                Add Item
                              </Button>
                            </div>
                            <Table responsive>
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>Previous Value</th>
                                  <th>Current Value</th>
                                  <th>Qty</th>
                                  <th>Rate</th>
                                  <th>Total</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {receiptItems.map((item, index) => {
                                  const selectedItem = items.find((i) => i.id === parseInt(item.item_id));
                                  const isDiscountOrPayment = selectedItem && (selectedItem.type === "discount" || selectedItem.type === "payment");
                                  
                                  return (
                                    <tr key={index}>
                                      <td>
                                        <Input
                                          type="select"
                                          value={item.item_id || ""}
                                          onChange={(e) => updateReceiptItem(index, "item_id", e.target.value)}
                                        >
                                          <option value="">Select Item</option>
                                          {items.map((i) => (
                                            <option key={i.id} value={i.id}>
                                              {i.name}
                                            </option>
                                          ))}
                                        </Input>
                                      </td>
                                      <td>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={item.previous_value !== null && item.previous_value !== undefined ? item.previous_value : ""}
                                          onChange={(e) => updateReceiptItem(index, "previous_value", e.target.value ? parseFloat(e.target.value) : null)}
                                          placeholder="Optional"
                                        />
                                      </td>
                                      <td>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={item.current_value !== null && item.current_value !== undefined ? item.current_value : ""}
                                          onChange={(e) => updateReceiptItem(index, "current_value", e.target.value ? parseFloat(e.target.value) : null)}
                                          placeholder="Optional"
                                        />
                                      </td>
                                      <td>
                                        {isDiscountOrPayment ? (
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value="1"
                                            readOnly
                                            disabled
                                            style={{ backgroundColor: "#f8f9fa" }}
                                          />
                                        ) : (
                                          <Input
                                            type="number"
                                            step="0.01"
                                            value={item.qty || ""}
                                            onChange={(e) => updateReceiptItem(index, "qty", parseFloat(e.target.value) || 0)}
                                          />
                                        )}
                                      </td>
                                      <td>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={item.rate || ""}
                                          onChange={(e) => updateReceiptItem(index, "rate", e.target.value)}
                                          onBlur={(e) => {
                                            if (isDiscountOrPayment) {
                                              const rateValue = parseFloat(e.target.value) || 0;
                                              updateReceiptItem(index, "rate", (-Math.abs(rateValue)).toString());
                                            }
                                          }}
                                          placeholder={isDiscountOrPayment ? "Enter amount (will be negative)" : ""}
                                        />
                                      </td>
                                      <td>{item.total ? item.total.toFixed(2) : "0.00"}</td>
                                      <td>
                                        <Button
                                          type="button"
                                          color="danger"
                                          size="sm"
                                          onClick={() => removeReceiptItem(index)}
                                        >
                                          Remove
                                        </Button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {receiptItems.length === 0 && (
                                  <tr>
                                    <td colSpan="7" className="text-center">
                                      No items added. Click "Add Item" to add items.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </Table>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col>
                          <div className="text-end">
                            <Button
                              type="button"
                              color="info"
                              className="me-2"
                              onClick={previewSplits}
                              disabled={receiptItems.length === 0 || !splitsPreview || splitsPreview.splits?.length === 0}
                            >
                              Preview Splits
                            </Button>
                            <Button type="submit" color="success">
                              Create Receipt
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Form>
                  </CardBody>
                </Card>
              </Col>
            </Row>
            )}
            </TabPane>
          </TabContent>

          {/* Splits Preview Modal */}
          <Modal isOpen={showSplitsModal} toggle={() => setShowSplitsModal(false)} size="lg">
            <ModalHeader toggle={() => setShowSplitsModal(false)}>Double-Entry Accounting Splits Preview</ModalHeader>
            <ModalBody>
              {splitsPreview && splitsPreview.splits && splitsPreview.splits.length > 0 ? (
                <div>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>People</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {splitsPreview.splits.map((split, index) => (
                        <tr key={index}>
                          <td>{split.account_name}</td>
                          <td>{split.people_name || "N/A"}</td>
                          <td>{split.debit ? split.debit.toFixed(2) : "-"}</td>
                          <td>{split.credit ? split.credit.toFixed(2) : "-"}</td>
                          <td>{split.status}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                        <td colSpan="2">Total</td>
                        <td>{splitsPreview.total_debit?.toFixed(2) || "0.00"}</td>
                        <td>{splitsPreview.total_credit?.toFixed(2) || "0.00"}</td>
                        <td>
                          <span className={splitsPreview.is_balanced ? "text-success" : "text-danger"}>
                            {splitsPreview.is_balanced ? "Yes ✓" : "No ✗"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                  <div className="text-end mt-3">
                    <Button color="secondary" onClick={() => setShowSplitsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>No splits to display. Please add items to the receipt.</p>
                  <Button color="secondary" onClick={() => setShowSplitsModal(false)}>
                    Close
                  </Button>
                </div>
              )}
            </ModalBody>
          </Modal>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default SalesReceipts;

