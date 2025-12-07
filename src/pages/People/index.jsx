import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import TableContainer from "../../components/Common/TableContainer";
import Spinners from "../../components/Common/Spinner";
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
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import DeleteModal from "/src/components/Common/DeleteModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const People = () => {
  document.title = "People";

  const [person, setPerson] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [people, setPeople] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [peopleTypes, setPeopleTypes] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (person && person.id) || "",
      name: (person && person.name) || "",
      phone: (person && person.phone) || "",
      type_id: (person && person.type_id) || "",
      building_id: (person && person.building_id) || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter Name"),
      phone: Yup.string().required("Please Enter Phone"),
      type_id: Yup.number().required("Please Select Type").min(1, "Please Select Type"),
      building_id: Yup.number().required("Please Select Building").min(1, "Please Select Building"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          const { data } = await axiosInstance.put(
            `people/${values.id}`,
            { 
              name: values.name,
              phone: values.phone,
              type_id: parseInt(values.type_id),
              building_id: parseInt(values.building_id)
            }
          );
          toast.success("Person updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchPeople();
        } else {
          const { data } = await axiosInstance.post("people", {
            name: values.name,
            phone: values.phone,
            type_id: parseInt(values.type_id),
            building_id: parseInt(values.building_id),
          });
          toast.success("Person created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchPeople();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchBuildings = async () => {
    try {
      const { data } = await axiosInstance.get("buildings");
      setBuildings(data || []);
    } catch (error) {
      console.log("Error fetching buildings", error);
    }
  };

  const fetchPeopleTypes = async () => {
    try {
      const { data } = await axiosInstance.get("people-types");
      setPeopleTypes(data || []);
    } catch (error) {
      console.log("Error fetching people types", error);
    }
  };

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("people");
      setPeople(data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch people");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchPeopleTypes();
    fetchPeople();
  }, []);

  const onDeletePerson = async () => {
    try {
      await axiosInstance.delete("people/" + person.id);
      toast.success("Person deleted successfully");
      setDeleteModal(false);
      fetchPeople();
    } catch (err) {
      toast.error("Failed to delete person");
      console.log(err);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Name",
        accessorKey: "name",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Phone",
        accessorKey: "phone",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Type",
        accessorKey: "people_type.title",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.people_type?.title || "N/A"}</>;
        },
      },
      {
        header: "Building",
        accessorKey: "building.name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.building?.name || "N/A"}</>;
        },
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const formattedDate = moment(cell.row.original.created_at).format("D MMM YY h:mmA");
          return <>{formattedDate}</>;
        },
      },
      {
        header: "Action",
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              <Link
                to="#"
                className="text-success"
                onClick={() => {
                  setIsEdit(true);
                  const personData = cellProps.row.original;
                  setPerson(personData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const personData = cellProps.row.original;
                  setPerson(personData);
                  setDeleteModal(true);
                }}
              >
                <i className="mdi mdi-delete font-size-18" />
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <React.Fragment>
      <DeleteModal
        show={deleteModal}
        warningText={"Are you sure to delete this person "}
        boldText={person?.name}
        onDeleteClick={() => onDeletePerson()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="People" breadcrumbItem="People" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={people || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setPerson("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New Person"
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
          <Modal
            isOpen={isNewModalOpen}
            toggle={() => setIsNewModelOpen(!isNewModalOpen)}
            size="lg"
          >
            <ModalHeader
              toggle={() => setIsNewModelOpen(!isNewModalOpen)}
              tag="h4"
            >
              {!!isEdit ? "Edit Person" : "Add Person"}
            </ModalHeader>
            <ModalBody>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                  return false;
                }}
              >
                <Row>
                  <Col xs={12}>
                    <div className="mb-3">
                      <Label>Name</Label>
                      <Input
                        name="name"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.name || ""}
                        invalid={
                          validation.touched.name && validation.errors.name
                            ? true
                            : false
                        }
                      />
                      {validation.touched.name && validation.errors.name ? (
                        <FormFeedback type="invalid">
                          {validation.errors.name}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Phone</Label>
                      <Input
                        name="phone"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.phone || ""}
                        invalid={
                          validation.touched.phone && validation.errors.phone
                            ? true
                            : false
                        }
                      />
                      {validation.touched.phone && validation.errors.phone ? (
                        <FormFeedback type="invalid">
                          {validation.errors.phone}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Type</Label>
                      <Input
                        name="type_id"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.type_id || ""}
                        invalid={
                          validation.touched.type_id && validation.errors.type_id
                            ? true
                            : false
                        }
                      >
                        <option value="">Select Type</option>
                        {peopleTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.title}
                          </option>
                        ))}
                      </Input>
                      {validation.touched.type_id && validation.errors.type_id ? (
                        <FormFeedback type="invalid">
                          {validation.errors.type_id}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Building</Label>
                      <Input
                        name="building_id"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.building_id || ""}
                        invalid={
                          validation.touched.building_id && validation.errors.building_id
                            ? true
                            : false
                        }
                      >
                        <option value="">Select Building</option>
                        {buildings.map((building) => (
                          <option key={building.id} value={building.id}>
                            {building.name}
                          </option>
                        ))}
                      </Input>
                      {validation.touched.building_id && validation.errors.building_id ? (
                        <FormFeedback type="invalid">
                          {validation.errors.building_id}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      <Button
                        type="submit"
                        color="success"
                        className="save-user"
                      >
                        {!!isEdit ? "Update Person" : "Add Person"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </ModalBody>
          </Modal>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default People;

