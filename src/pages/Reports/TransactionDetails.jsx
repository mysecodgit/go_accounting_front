import React, { useEffect, useState } from "react";
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
  Input,
  Button,
  Table,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const TransactionDetails = () => {
  document.title = "Transaction Details";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      account_ids: [],
      transaction_type: "",
      start_date: moment().subtract(30, "days").format("YYYY-MM-DD"),
      end_date: moment().format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      start_date: Yup.string().required("Start date is required"),
      end_date: Yup.string().required("End date is required"),
    }),
    onSubmit: async (values) => {
      await fetchReport(values);
    },
  });

  const fetchAccounts = async () => {
    if (!buildingId) return;
    try {
      const url = `buildings/${buildingId}/accounts`;
      const { data } = await axiosInstance.get(url);
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchReport = async (filters) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      let url = `buildings/${buildingId}/reports/transaction-details?start_date=${filters.start_date}&end_date=${filters.end_date}`;
      if (filters.account_ids && filters.account_ids.length > 0) {
        url += `&account_ids=${filters.account_ids.join(",")}`;
      }
      if (filters.transaction_type) {
        url += `&transaction_type=${filters.transaction_type}`;
      }
      const { data } = await axiosInstance.get(url);
      setReport(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch report");
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buildingId) {
      fetchAccounts();
      fetchReport(validation.values);
    }
  }, [buildingId]);

  const handleAccountChange = (accountId, checked) => {
    let newIds = [...selectedAccountIds];
    if (checked) {
      if (!newIds.includes(accountId)) {
        newIds.push(accountId);
      }
    } else {
      newIds = newIds.filter((id) => id !== accountId);
    }
    setSelectedAccountIds(newIds);
    validation.setFieldValue("account_ids", newIds);
  };

  const columns = [
    {
      Header: "Date",
      accessor: "transaction_date",
      id: "transaction_date",
      Cell: ({ value }) => moment(value).format("YYYY-MM-DD"),
    },
    {
      Header: "Type",
      accessor: "transaction_type",
      id: "transaction_type",
    },
    {
      Header: "Account",
      accessor: "account_name",
      id: "account_name",
    },
    {
      Header: "Customer/Vendor",
      accessor: "people_name",
      id: "people_name",
      Cell: ({ value }) => value || "-",
    },
    {
      Header: "Description",
      accessor: "description",
      id: "description",
    },
    {
      Header: "Debit",
      accessor: "debit",
      id: "debit",
      Cell: ({ value }) => (value ? parseFloat(value).toFixed(2) : "-"),
      className: "text-end",
    },
    {
      Header: "Credit",
      accessor: "credit",
      id: "credit",
      Cell: ({ value }) => (value ? parseFloat(value).toFixed(2) : "-"),
      className: "text-end",
    },
    {
      Header: "Balance",
      accessor: "balance",
      id: "balance",
      Cell: ({ value }) => {
        const val = parseFloat(value || 0);
        return (
          <span className={val >= 0 ? "text-success" : "text-danger"}>
            {val.toFixed(2)}
          </span>
        );
      },
      className: "text-end",
    },
  ];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Transaction Details" breadcrumbItem="Transaction Details" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Label>Accounts (Select one or more)</Label>
                      <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #dee2e6", padding: "10px", borderRadius: "4px" }}>
                        {accounts.map((account) => (
                          <div key={account.id} className="form-check">
                            <Input
                              className="form-check-input"
                              type="checkbox"
                              id={`account-${account.id}`}
                              checked={selectedAccountIds.includes(account.id)}
                              onChange={(e) => handleAccountChange(account.id, e.target.checked)}
                            />
                            <Label className="form-check-label" for={`account-${account.id}`}>
                              {account.account_name} ({account.account_number})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={3}>
                      <Label>Start Date <span className="text-danger">*</span></Label>
                      <Input
                        name="start_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.start_date}
                        invalid={validation.touched.start_date && validation.errors.start_date ? true : false}
                      />
                    </Col>
                    <Col md={3}>
                      <Label>End Date <span className="text-danger">*</span></Label>
                      <Input
                        name="end_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.end_date}
                        invalid={validation.touched.end_date && validation.errors.end_date ? true : false}
                      />
                    </Col>
                    <Col md={3}>
                      <Label>Transaction Type</Label>
                      <Input
                        name="transaction_type"
                        type="select"
                        onChange={validation.handleChange}
                        value={validation.values.transaction_type}
                      >
                        <option value="">All Types</option>
                        <option value="invoice">Invoice</option>
                        <option value="sales receipt">Sales Receipt</option>
                        <option value="invoice payment">Invoice Payment</option>
                      </Input>
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Button
                        type="button"
                        color="primary"
                        onClick={validation.handleSubmit}
                        disabled={isLoading}
                      >
                        Generate Report
                      </Button>
                    </Col>
                  </Row>

                  {isLoading && <Spinners />}

                  {report && !isLoading && (
                    <div>
                      {report.account_id ? (
                        <div>
                          <Row className="mb-3">
                            <Col>
                              <h5>{report.account_name}</h5>
                              <p className="text-muted">
                                Period: {moment(report.start_date).format("MMM DD, YYYY")} - {moment(report.end_date).format("MMM DD, YYYY")}
                              </p>
                            </Col>
                          </Row>
                          <Row className="mb-3">
                            <Col md={3}>
                              <strong>Opening Balance: </strong>
                              <span>{parseFloat(report.opening_balance || 0).toFixed(2)}</span>
                            </Col>
                            <Col md={3}>
                              <strong>Total Debit: </strong>
                              <span className="text-danger">{parseFloat(report.total_debit || 0).toFixed(2)}</span>
                            </Col>
                            <Col md={3}>
                              <strong>Total Credit: </strong>
                              <span className="text-success">{parseFloat(report.total_credit || 0).toFixed(2)}</span>
                            </Col>
                            <Col md={3}>
                              <strong>Closing Balance: </strong>
                              <span>{parseFloat(report.closing_balance || 0).toFixed(2)}</span>
                            </Col>
                          </Row>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <p className="text-muted">
                            Period: {moment(report.start_date).format("MMM DD, YYYY")} - {moment(report.end_date).format("MMM DD, YYYY")}
                          </p>
                          <p>
                            <strong>Total Debit: </strong>
                            <span className="text-danger">{parseFloat(report.total_debit || 0).toFixed(2)}</span>
                            {" | "}
                            <strong>Total Credit: </strong>
                            <span className="text-success">{parseFloat(report.total_credit || 0).toFixed(2)}</span>
                          </p>
                        </div>
                      )}

                      <TableContainer
                        columns={columns}
                        data={report.transactions || []}
                        isGlobalFilter={true}
                        isPagination={true}
                        isShowingPageSize={true}
                        paginationDiv="noPagination"
                        tableClass="table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        theadClass="table-light"
                        pagination="pagination-rounded"
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default TransactionDetails;

