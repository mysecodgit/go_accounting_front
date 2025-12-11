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
  Label,
  FormFeedback,
  Input,
  Form,
  Button,
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

const InvoicePayments = () => {
  document.title = "Invoice Payments";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("1"); // "1" for list, "2" for create
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [invoiceBalances, setInvoiceBalances] = useState({}); // invoice_id -> balance
  const [userId, setUserId] = useState(1); // TODO: Get from auth context

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      date: moment().format("YYYY-MM-DD"),
      invoice_id: "",
      account_id: "",
      amount: 0,
      status: 1,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      date: Yup.date().required("Date is required"),
      invoice_id: Yup.number().required("Invoice is required").min(1, "Please select an invoice"),
      account_id: Yup.number().required("Asset Account is required").min(1, "Please select an asset account"),
      amount: Yup.number().required("Amount is required"),
      status: Yup.number().oneOf([0, 1]),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          date: values.date,
          invoice_id: parseInt(values.invoice_id),
          account_id: parseInt(values.account_id),
          amount: parseFloat(values.amount),
          status: parseInt(values.status),
          building_id: parseInt(values.building_id),
        };

        let url = "invoice-payments";
        if (buildingId) {
          url = `buildings/${buildingId}/invoice-payments`;
        }

        // Add user_id to headers
        const config = {
          headers: {
            "User-ID": userId.toString(),
          },
        };

        const { data } = await axiosInstance.post(url, payload, config);
        toast.success("Invoice payment created successfully");
        validation.resetForm();
        // Switch to list tab and refresh payments and invoices (to update balances)
        setActiveTab("1");
        fetchPayments();
        fetchInvoices(); // Refresh invoices to recalculate balances
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchInvoices = async () => {
    try {
      let url = "invoices";
      if (buildingId) {
        url = `buildings/${buildingId}/invoices`;
      }
      const { data } = await axiosInstance.get(url);
      setInvoices(data || []);
      // Calculate balances for each invoice
      calculateInvoiceBalances(data || []);
    } catch (error) {
      console.log("Error fetching invoices", error);
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

  const calculateInvoiceBalances = async (invoicesList) => {
    try {
      const balances = {};
      for (const invoice of invoicesList) {
        let url = `invoices/${invoice.id}/payments`;
        if (buildingId) {
          url = `buildings/${buildingId}/invoices/${invoice.id}/payments`;
        }
        try {
          const { data: invoicePayments } = await axiosInstance.get(url);
          const totalPaid = (invoicePayments || []).reduce((sum, payment) => {
            return sum + (parseFloat(payment.amount) || 0);
          }, 0);
          balances[invoice.id] = (parseFloat(invoice.amount) || 0) - totalPaid;
        } catch (err) {
          // If payments endpoint fails, use invoice amount as balance
          balances[invoice.id] = parseFloat(invoice.amount) || 0;
        }
      }
      setInvoiceBalances(balances);
    } catch (error) {
      console.log("Error calculating invoice balances", error);
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

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let url = "invoice-payments";
      if (buildingId) {
        url = `buildings/${buildingId}/invoice-payments`;
      } else {
        url = `invoice-payments?building_id=${buildingId || ""}`;
      }
      const { data } = await axiosInstance.get(url);
      setPayments(data || []);
    } catch (error) {
      console.log("Error fetching invoice payments", error);
      toast.error("Failed to fetch invoice payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
    fetchUnits();
    fetchPeople();
    if (activeTab === "1") {
      fetchPayments();
    }
  }, [buildingId, activeTab]);

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.date ? moment(cell.row.original.date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Invoice #",
        accessorKey: "invoice_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const invoice = invoices.find((i) => i.id === cell.row.original.invoice_id);
          return <>{invoice ? `#${invoice.invoice_no}` : `ID: ${cell.row.original.invoice_id || "N/A"}`}</>;
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
        header: "Account",
        accessorKey: "account_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const account = accounts.find((a) => a.id === cell.row.original.account_id);
          return <>{account ? account.account_name : `ID: ${cell.row.original.account_id || "N/A"}`}</>;
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
    [invoices, accounts, units, people]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Invoice Payments" breadcrumbItem="Invoice Payments" />
          <Nav tabs className="nav-tabs-custom">
            <NavItem>
              <NavLink
                className={activeTab === "1" ? "active" : ""}
                onClick={() => {
                  setActiveTab("1");
                  fetchPayments();
                }}
                style={{ cursor: "pointer" }}
              >
                <i className="bx bx-list-ul me-1"></i> Payment List
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === "2" ? "active" : ""}
                onClick={() => setActiveTab("2")}
                style={{ cursor: "pointer" }}
              >
                <i className="bx bx-plus-circle me-1"></i> Record Payment
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
                          data={payments || []}
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
                                <Label>Date <span className="text-danger">*</span></Label>
                                <Input
                                  name="date"
                                  type="date"
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  value={validation.values.date || ""}
                                  invalid={validation.touched.date && validation.errors.date ? true : false}
                                />
                                {validation.touched.date && validation.errors.date ? (
                                  <FormFeedback type="invalid">{validation.errors.date}</FormFeedback>
                                ) : null}
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <Label>Invoice <span className="text-danger">*</span></Label>
                                <Input
                                  name="invoice_id"
                                  type="select"
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  value={validation.values.invoice_id || ""}
                                  invalid={validation.touched.invoice_id && validation.errors.invoice_id ? true : false}
                                >
                                  <option value="">Select Invoice</option>
                                  {invoices
                                    .filter((invoice) => {
                                      const balance = invoiceBalances[invoice.id] !== undefined 
                                        ? invoiceBalances[invoice.id] 
                                        : (parseFloat(invoice.amount) || 0);
                                      // Only show invoices with non-zero balance
                                      return balance !== 0;
                                    })
                                    .map((invoice) => {
                                      const unit = units.find((u) => u.id === invoice.unit_id);
                                      const person = people.find((p) => p.id === invoice.people_id);
                                      const balance = invoiceBalances[invoice.id] !== undefined 
                                        ? invoiceBalances[invoice.id] 
                                        : (parseFloat(invoice.amount) || 0);
                                      const unitName = unit ? (unit.unit_number || unit.name) : "N/A";
                                      const customerName = person ? person.name : "N/A";
                                      const balanceText = balance >= 0 ? balance.toFixed(2) : `(${Math.abs(balance).toFixed(2)})`;
                                      
                                      return (
                                        <option key={invoice.id} value={invoice.id}>
                                          Invoice #{invoice.invoice_no} | Unit: {unitName} | Customer: {customerName} | Balance: {balanceText}
                                        </option>
                                      );
                                    })}
                                </Input>
                                {validation.touched.invoice_id && validation.errors.invoice_id ? (
                                  <FormFeedback type="invalid">{validation.errors.invoice_id}</FormFeedback>
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
                                <Label>Amount <span className="text-danger">*</span></Label>
                                <Input
                                  name="amount"
                                  type="number"
                                  step="0.01"
                                  onChange={validation.handleChange}
                                  onBlur={validation.handleBlur}
                                  value={validation.values.amount || 0}
                                  invalid={validation.touched.amount && validation.errors.amount ? true : false}
                                />
                                {validation.touched.amount && validation.errors.amount ? (
                                  <FormFeedback type="invalid">{validation.errors.amount}</FormFeedback>
                                ) : null}
                              </div>
                            </Col>
                          </Row>

                          <Row>
                            <Col>
                              <div className="text-end">
                                <Button type="submit" color="success">
                                  Record Payment
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
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default InvoicePayments;

