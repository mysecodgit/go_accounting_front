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
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";
import { formatNumber, formatNumberOrDash } from "../../utils/numberFormat";

const TrialBalance = () => {
  document.title = "Trial Balance";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      as_of_date: moment().format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      as_of_date: Yup.string().required("Date is required"),
    }),
    onSubmit: async (values) => {
      await fetchReport(values);
    },
  });

  const fetchReport = async (filters) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      const url = `buildings/${buildingId}/reports/trial-balance?as_of_date=${filters.as_of_date}`;
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
      fetchReport(validation.values);
    }
  }, [buildingId]);

  const columns = [
    {
      id: "account_number",
      header: "Account #",
      accessorKey: "account_number",
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.is_total_row) {
          return <>-</>;
        }
        return <>{row.original.account_number || "-"}</>;
      },
    },
    {
      id: "account_name",
      header: "Account Name",
      accessorKey: "account_name",
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.is_total_row) {
          return <strong>TOTAL</strong>;
        }
        return <>{row.original.account_name || "-"}</>;
      },
    },
    // {
    //   id: "account_type",
    //   header: "Account Type",
    //   accessorKey: "account_type",
    //   enableColumnFilter: false,
    //   enableSorting: false,
    //   cell: ({ row }) => {
    //     if (row.original.is_total_row) {
    //       return <>-</>;
    //     }
    //     return <>{row.original.account_type || "-"}</>;
    //   },
    // },
    {
      id: "debit_balance",
      header: "Debit",
      accessorKey: "debit_balance",
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.is_total_row) {
          return <strong>{formatNumber(row.original.debit_balance || 0)}</strong>;
        }
        const val = parseFloat(row.original.debit_balance || 0);
        return <>{formatNumberOrDash(val)}</>;
      },
    },
    {
      id: "credit_balance",
      header: "Credit",
      accessorKey: "credit_balance",
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.is_total_row) {
          return <strong>{formatNumber(row.original.credit_balance || 0)}</strong>;
        }
        const val = parseFloat(row.original.credit_balance || 0);
        return <>{formatNumberOrDash(val)}</>;
      },
    },
  ];

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Trial Balance" breadcrumbItem="Trial Balance" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={3}>
                      <Label>As Of Date <span className="text-danger">*</span></Label>
                      <Input
                        name="as_of_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.as_of_date}
                        invalid={validation.touched.as_of_date && validation.errors.as_of_date ? true : false}
                      />
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
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Row className="mb-3" style={{ width: "60%", textAlign: "center" }}>
                        <Col>
                          <h5>Trial Balance</h5>
                          <p className="text-muted">
                            As of: {moment(report.as_of_date).format("MMM DD, YYYY")}
                            {report.is_balanced ? (
                              <span className="text-success ms-2">
                                <strong>✓ Balanced</strong>
                              </span>
                            ) : (
                              <span className="text-danger ms-2">
                                <strong>✗ Not Balanced</strong> (Difference: {formatNumber(Math.abs(parseFloat(report.total_debit || 0) - parseFloat(report.total_credit || 0)))})
                              </span>
                            )}
                          </p>
                        </Col>
                      </Row>

                      <div style={{ width: "30%", margin: "0 auto" }}>
                        <TableContainer
                          columns={columns}
                          data={report.accounts || []}
                          isGlobalFilter={true}
                          isPagination={false}
                          tableClass="table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                          theadClass="table-light"
                        />
                      </div>
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

export default TrialBalance;

