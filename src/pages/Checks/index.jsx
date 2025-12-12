import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Button,
  Table,
} from "reactstrap";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const Checks = () => {
  document.title = "Checks";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [checks, setChecks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [viewingCheck, setViewingCheck] = useState(null);
  const [showCheckDetailsModal, setShowCheckDetailsModal] = useState(false);

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data || []);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchChecks = async () => {
    try {
      setLoading(true);
      let url = "checks";
      if (buildingId) {
        url = `buildings/${buildingId}/checks`;
      } else {
        url = `checks?building_id=${buildingId || ""}`;
      }
      const { data } = await axiosInstance.get(url);
      setChecks(data || []);
    } catch (error) {
      console.log("Error fetching checks", error);
      toast.error("Failed to fetch checks");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckDetails = async (checkId) => {
    try {
      setLoading(true);
      let url = `checks/${checkId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/checks/${checkId}`;
      }
      const { data: checkResponse } = await axiosInstance.get(url);
      setViewingCheck(checkResponse);
      setShowCheckDetailsModal(true);
    } catch (error) {
      console.log("Error fetching check details", error);
      toast.error("Failed to fetch check details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchChecks();
  }, [buildingId]);

  const columns = useMemo(
    () => [
      {
        header: "Check Date",
        accessorKey: "check_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.check_date ? moment(cell.row.original.check_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Reference Number",
        accessorKey: "reference_number",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.reference_number || "N/A"}</>;
        },
      },
      {
        header: "Payment Account",
        accessorKey: "payment_account_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const account = accounts.find((a) => a.id === cell.row.original.payment_account_id);
          return <>{account ? `${account.account_name} (${account.account_number})` : `ID: ${cell.row.original.payment_account_id || "N/A"}`}</>;
        },
      },
      {
        header: "Total Amount",
        accessorKey: "total_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.total_amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Actions",
        accessorKey: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          return (
            <div className="d-flex gap-2">
              <Button
                type="button"
                color="info"
                size="sm"
                onClick={() => {
                  fetchCheckDetails(cell.row.original.id);
                }}
              >
                <i className="bx bx-show"></i> View
              </Button>
              <Button
                type="button"
                color="primary"
                size="sm"
                onClick={() => navigate(`/building/${buildingId}/checks/${cell.row.original.id}/edit`)}
              >
                <i className="bx bx-edit"></i> Edit
              </Button>
            </div>
          );
        },
      },
    ],
    [accounts, buildingId, navigate]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Checks" breadcrumbItem="Checks" />
          <Row className="mb-3">
            <Col>
              <Button color="success" onClick={() => navigate(`/building/${buildingId}/checks/create`)}>
                <i className="bx bx-plus me-1"></i> Create Check
              </Button>
            </Col>
          </Row>
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={checks || []}
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

          {/* Check Details Modal */}
          <Modal isOpen={showCheckDetailsModal} toggle={() => setShowCheckDetailsModal(false)} size="xl">
            <ModalHeader toggle={() => setShowCheckDetailsModal(false)}>Check Details</ModalHeader>
            <ModalBody>
              {viewingCheck ? (
                <div>
                  {/* Check Information */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <h5>Check Information</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td><strong>Check Date:</strong></td>
                            <td>{viewingCheck.check?.check_date ? moment(viewingCheck.check.check_date).format("YYYY-MM-DD") : moment(viewingCheck.check_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>Reference Number:</strong></td>
                            <td>{viewingCheck.check?.reference_number || viewingCheck.reference_number || "N/A"}</td>
                          </tr>
                          <tr>
                            <td><strong>Payment Account:</strong></td>
                            <td>
                              {(() => {
                                const accountId = viewingCheck.check?.payment_account_id || viewingCheck.payment_account_id;
                                const account = accounts.find((a) => a.id === accountId);
                                return account ? `${account.account_name} (${account.account_number})` : `ID: ${accountId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Total Amount:</strong></td>
                            <td>{parseFloat(viewingCheck.check?.total_amount || viewingCheck.total_amount || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td><strong>Memo:</strong></td>
                            <td>{viewingCheck.check?.memo || viewingCheck.memo || "N/A"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  {/* Expense Lines */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Expense Lines</h5>
                      <Table bordered responsive>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Unit</th>
                            <th>People</th>
                            <th>Description</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewingCheck.expense_lines || []).map((line, index) => {
                            const account = accounts.find((a) => a.id === line.account_id);
                            return (
                              <tr key={index}>
                                <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${line.account_id}`}</td>
                                <td>{line.unit_id || "N/A"}</td>
                                <td>{line.people_id || "N/A"}</td>
                                <td>{line.description || "N/A"}</td>
                                <td>{parseFloat(line.amount || 0).toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  {/* Splits */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Double-Entry Accounting Splits</h5>
                      <Table bordered responsive>
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
                          {(viewingCheck.splits || []).map((split, index) => {
                            const account = accounts.find((a) => a.id === split.account_id);
                            return (
                              <tr key={index} style={{ backgroundColor: split.status === "1" ? "transparent" : "#f8f9fa" }}>
                                <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${split.account_id}`}</td>
                                <td>{split.people_id || "N/A"}</td>
                                <td>{split.debit ? parseFloat(split.debit).toFixed(2) : "-"}</td>
                                <td>{split.credit ? parseFloat(split.credit).toFixed(2) : "-"}</td>
                                <td>
                                  <span className={`badge ${split.status === "1" ? "bg-success" : "bg-secondary"}`}>
                                    {split.status === "1" ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                            <td colSpan="2">Total (Active Only)</td>
                            <td>
                              {(viewingCheck.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.debit) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              {(viewingCheck.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.credit) || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </Col>
                  </Row>

                  <div className="text-end mt-3">
                    <Button color="secondary" onClick={() => setShowCheckDetailsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>Loading check details...</p>
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

export default Checks;

