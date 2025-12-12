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

const Invoices = () => {
  document.title = "Invoices";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);

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
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = "invoices";
      if (buildingId) {
        url = `buildings/${buildingId}/invoices`;
      } else {
        url = `invoices?building_id=${buildingId || ""}`;
      }
      const { data } = await axiosInstance.get(url);
      setInvoices(data || []);
    } catch (error) {
      console.log("Error fetching invoices", error);
      toast.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoiceId) => {
    try {
      setLoading(true);
      let url = `invoices/${invoiceId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/invoices/${invoiceId}`;
      }
      const { data: invoiceResponse } = await axiosInstance.get(url);
      setViewingInvoice(invoiceResponse);
      setShowInvoiceDetailsModal(true);
    } catch (error) {
      console.log("Error fetching invoice details", error);
      toast.error("Failed to fetch invoice details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchPeople();
    fetchAccounts();
    fetchInvoices();
  }, [buildingId]);

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        header: "Invoice #",
        accessorKey: "invoice_no",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Sales Date",
        accessorKey: "sales_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.sales_date ? moment(cell.row.original.sales_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Due Date",
        accessorKey: "due_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.due_date ? moment(cell.row.original.due_date).format("YYYY-MM-DD") : "N/A"}</>;
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
            <span className={`badge ${(status === 1 || status === "1") ? "bg-success" : "bg-secondary"}`}>
              {(status === 1 || status === "1") ? "Active" : "Inactive"}
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
                  fetchInvoiceDetails(cell.row.original.id);
                }}
              >
                <i className="bx bx-show"></i> View
              </Button>
              <Button
                type="button"
                color="primary"
                size="sm"
                onClick={() => navigate(`/building/${buildingId}/invoices/${cell.row.original.id}/edit`)}
              >
                <i className="bx bx-edit"></i> Edit
              </Button>
            </div>
          );
        },
      },
    ],
    [people, units, buildingId, navigate]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Invoices" breadcrumbItem="Invoices" />
          <Row className="mb-3">
            <Col>
              <Button
                color="primary"
                onClick={() => navigate(`/building/${buildingId}/invoices/create`)}
              >
                <i className="bx bx-plus-circle me-1"></i> Create Invoice
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
                      data={invoices || []}
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

          {/* Invoice Details Modal */}
          <Modal isOpen={showInvoiceDetailsModal} toggle={() => setShowInvoiceDetailsModal(false)} size="xl">
            <ModalHeader toggle={() => setShowInvoiceDetailsModal(false)}>Invoice Details</ModalHeader>
            <ModalBody>
              {viewingInvoice ? (
                <div>
                  {/* Invoice Information */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <h5>Invoice Information</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td><strong>Invoice Number:</strong></td>
                            <td>{viewingInvoice.invoice?.invoice_no || viewingInvoice.invoice_no}</td>
                          </tr>
                          <tr>
                            <td><strong>Sales Date:</strong></td>
                            <td>{viewingInvoice.invoice?.sales_date ? moment(viewingInvoice.invoice.sales_date).format("YYYY-MM-DD") : moment(viewingInvoice.sales_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>Due Date:</strong></td>
                            <td>{viewingInvoice.invoice?.due_date ? moment(viewingInvoice.invoice.due_date).format("YYYY-MM-DD") : moment(viewingInvoice.due_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>Unit:</strong></td>
                            <td>
                              {(() => {
                                const unitId = viewingInvoice.invoice?.unit_id || viewingInvoice.unit_id;
                                const unit = units.find((u) => u.id === unitId);
                                return unit ? unit.name : `ID: ${unitId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Customer:</strong></td>
                            <td>
                              {(() => {
                                const peopleId = viewingInvoice.invoice?.people_id || viewingInvoice.people_id;
                                const person = people.find((p) => p.id === peopleId);
                                return person ? person.name : `ID: ${peopleId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>A/R Account:</strong></td>
                            <td>
                              {(() => {
                                const arAccountId = viewingInvoice.invoice?.ar_account_id || viewingInvoice.ar_account_id;
                                const account = accounts.find((a) => a.id === arAccountId);
                                return account ? `${account.account_name} (${account.account_number})` : `ID: ${arAccountId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Amount:</strong></td>
                            <td>{parseFloat(viewingInvoice.invoice?.amount || viewingInvoice.amount || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td><strong>Description:</strong></td>
                            <td>{viewingInvoice.invoice?.description || viewingInvoice.description || "N/A"}</td>
                          </tr>
                          <tr>
                            <td><strong>Reference:</strong></td>
                            <td>{viewingInvoice.invoice?.refrence || viewingInvoice.refrence || "N/A"}</td>
                          </tr>
                          <tr>
                            <td><strong>Status:</strong></td>
                            <td>
                              <span className={`badge ${(viewingInvoice.invoice?.status || viewingInvoice.status) === 1 ? "bg-success" : "bg-secondary"}`}>
                                {(viewingInvoice.invoice?.status || viewingInvoice.status) === 1 ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  {/* Invoice Items */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Invoice Items</h5>
                      {/* Active Items */}
                      {(viewingInvoice.items || []).filter(item => item.status === "1" || item.status === 1).length > 0 && (
                        <Table bordered responsive className="mb-3">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Previous Value</th>
                              <th>Current Value</th>
                              <th>Qty</th>
                              <th>Rate</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(viewingInvoice.items || []).filter(item => item.status === "1" || item.status === 1).map((item, index) => (
                              <tr key={index}>
                                <td>{item.item_name}</td>
                                <td>{item.previous_value !== null && item.previous_value !== undefined ? parseFloat(item.previous_value).toFixed(3) : "N/A"}</td>
                                <td>{item.current_value !== null && item.current_value !== undefined ? parseFloat(item.current_value).toFixed(3) : "N/A"}</td>
                                <td>{item.qty !== null && item.qty !== undefined ? parseFloat(item.qty).toFixed(2) : "N/A"}</td>
                                <td>{item.rate || "N/A"}</td>
                                <td>{parseFloat(item.total || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}

                      {/* Previous Invoice Items (Inactive) */}
                      {(viewingInvoice.items || []).filter(item => item.status !== "1" && item.status !== 1).length > 0 && (
                        <div>
                          <h6 className="text-muted mt-3 mb-2">Previous Invoice Items</h6>
                          <Table bordered responsive>
                            <thead>
                              <tr>
                                <th>Item Name</th>
                                <th>Previous Value</th>
                                <th>Current Value</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Total</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(viewingInvoice.items || []).filter(item => item.status !== "1" && item.status !== 1).map((item, index) => (
                                <tr key={index} style={{ backgroundColor: "#f8f9fa" }}>
                                  <td>{item.item_name}</td>
                                  <td>{item.previous_value !== null && item.previous_value !== undefined ? parseFloat(item.previous_value).toFixed(3) : "N/A"}</td>
                                  <td>{item.current_value !== null && item.current_value !== undefined ? parseFloat(item.current_value).toFixed(3) : "N/A"}</td>
                                  <td>{item.qty !== null && item.qty !== undefined ? parseFloat(item.qty).toFixed(2) : "N/A"}</td>
                                  <td>{item.rate || "N/A"}</td>
                                  <td>{parseFloat(item.total || 0).toFixed(2)}</td>
                                  <td>
                                    <span className="badge bg-secondary">Inactive</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Col>
                  </Row>

                  {/* Splits - Active and Inactive */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Double-Entry Accounting Splits</h5>
                      <Table bordered responsive>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Customer/Vendor</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewingInvoice.splits || []).map((split, index) => {
                            const account = accounts.find((a) => a.id === split.account_id);
                            const person = split.people_id ? people.find((p) => p.id === split.people_id) : null;
                            return (
                              <tr key={index} style={{ backgroundColor: split.status === "1" ? "transparent" : "#f8f9fa" }}>
                                <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${split.account_id}`}</td>
                                <td>{person ? person.name : split.people_id ? `ID: ${split.people_id}` : "N/A"}</td>
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
                              {(viewingInvoice.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.debit) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              {(viewingInvoice.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.credit) || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </Col>
                  </Row>

                  <div className="text-end mt-3">
                    <Button color="secondary" onClick={() => setShowInvoiceDetailsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>Loading invoice details...</p>
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

export default Invoices;
